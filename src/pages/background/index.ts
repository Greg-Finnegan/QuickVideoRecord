// Background service worker for Chrome Window Recorder
import type { CloseSidePanelMessage, RecordingSessionState } from "../../types";

console.log("Background service worker loaded");

// On startup, check for any recordings stuck in transcribing state
checkStuckTranscriptions();

clearStaleRecordingState();

// Restore recording icon if service worker restarts mid-recording
chrome.storage.session.get("isRecording").then((data) => {
  if (data.isRecording) setRecordingIcon();
});

function setRecordingIcon() {
  chrome.action.setIcon({
    path: {
      16: "icon-recording-16.png",
      48: "icon-recording-48.png",
      128: "icon-recording-128.png",
    },
  });
}

function setDefaultIcon() {
  chrome.action.setIcon({
    path: {
      16: "icon-16.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
  });
}

const CLEARED_RECORDING_STATE = {
  isRecording: false,
  isPaused: false,
  recorderTabId: null,
} as const satisfies RecordingSessionState;

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.session.get("recorderTabId") as Partial<RecordingSessionState>;
  if (data.recorderTabId === tabId) {
    chrome.storage.session.set(CLEARED_RECORDING_STATE);
    setDefaultIcon();
  }
});

async function clearStaleRecordingState() {
  const data = await chrome.storage.session.get(["isRecording", "recorderTabId"]) as Partial<RecordingSessionState>;
  if (data.isRecording && data.recorderTabId) {
    try {
      await chrome.tabs.get(data.recorderTabId);
    } catch {
      await chrome.storage.session.set(CLEARED_RECORDING_STATE);
      setDefaultIcon();
    }
  }
}

// The single place the side panel is opened — chrome.sidePanel.open() only
// works while the user gesture that triggered it is still active, so it must
// be called synchronously, never after an await.
function openSidePanelForWindow(windowId: number) {
  chrome.sidePanel.open({ windowId }).catch((error) => {
    console.warn("[Background] Failed to open side panel:", error);
  });
}

// Chrome has no sidePanel.close() API. The panel hosted in `windowId` closes
// itself when it receives this; panels in other windows ignore it.
function requestSidePanelClose(windowId: number) {
  chrome.runtime
    .sendMessage({
      action: "closeSidePanel",
      windowId,
    } satisfies CloseSidePanelMessage)
    .catch(() => {
      // No extension page listening — expected when no panel is open.
    });
}

// Best-effort fallback for senders that are not hosted in a tab. The await
// drops the user gesture, so open() will usually reject here; it is logged
// rather than thrown. Tab senders must use sender.tab.windowId instead.
async function openSidePanelInLastFocusedWindow() {
  try {
    const win = await chrome.windows.getLastFocused();
    if (win.id !== undefined) await chrome.sidePanel.open({ windowId: win.id });
  } catch (error) {
    console.warn(
      "[Background] Could not open side panel without a tab sender:",
      error
    );
  }
}

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId !== undefined) openSidePanelForWindow(tab.windowId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Open the side panel from another extension page (must stay synchronous —
  // sidePanel.open() loses the user gesture across an await).
  if (message.action === "openSidePanel") {
    const windowId = sender.tab?.windowId;
    if (windowId !== undefined) {
      openSidePanelForWindow(windowId);
    } else {
      openSidePanelInLastFocusedWindow();
    }
    return false;
  }

  // Toggle the side panel for the window the click came from. No open/closed
  // state is tracked: the close request is dispatched to the extension contexts
  // that exist right now, so only a panel that was ALREADY open in this window
  // can receive it. A panel created by the open() below is created afterwards
  // and never sees it, so exactly one of the two actions takes effect.
  // The sendMessage must stay strictly before open(), in this same synchronous
  // block — open() must run inside the user gesture.
  if (message.action === "toggleSidePanel") {
    const windowId = sender.tab?.windowId;
    if (windowId === undefined) {
      console.warn("[Background] toggleSidePanel ignored: sender has no window");
      return false;
    }
    requestSidePanelClose(windowId);
    openSidePanelForWindow(windowId);
    return false;
  }

  // Forward transcription progress messages (best-effort from offscreen)
  if (message.action === "transcriptionProgress") {
    return false;
  }

  if (message.action === "recordingStarted") {
    const recorderTabId = sender.tab?.id ?? null;
    chrome.storage.session.set({
      isRecording: true,
      isPaused: false,
      recorderTabId,
    } satisfies RecordingSessionState);
    setRecordingIcon();
    return false;
  }

  if (message.action === "recordingPaused") {
    chrome.storage.session.set({ isPaused: true });
    return false;
  }

  if (message.action === "recordingResumed") {
    chrome.storage.session.set({ isPaused: false });
    return false;
  }

  if (message.action === "recordingError") {
    chrome.storage.session.set(CLEARED_RECORDING_STATE);
    setDefaultIcon();
    return false;
  }

  // Save transcript from offscreen document to the recording in storage
  if (message.action === "saveTranscript") {
    saveTranscript(
      message.recordingId,
      message.transcript,
      message.generatingFilename === true
    )
      .then(() => sendResponse({ success: true }))
      .catch((err: any) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }

  if (message.action === "saveGeneratedFilename") {
    saveGeneratedFilename(message.recordingId, message.generatedFilename)
      .then(() => sendResponse({ success: true }))
      .catch((err: any) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Handle transcription failure from offscreen document
  if (message.action === "transcriptionFailed") {
    clearTranscribingFlag(message.recordingId);
    return false;
  }

  // Close offscreen document when transcription is done
  if (message.action === "closeOffscreen") {
    chrome.offscreen.closeDocument().catch(() => { });
    return false;
  }

  if (message.action === "startCapture") {
    const recorderTabId = message.recorderTabId;

    if (!recorderTabId) {
      console.error("No recorderTabId provided");
      sendResponse({ streamId: null });
      return true;
    }

    console.log("Requesting desktopCapture for recorder tab:", recorderTabId);

    // The second parameter should be undefined or omitted for side panels/popups
    // chooseDesktopMedia will show the picker in the current window
    chrome.desktopCapture.chooseDesktopMedia(
      ["screen", "window", "tab"],
      (streamId) => {
        console.log("DesktopCapture returned streamId:", streamId);
        if (streamId && streamId.length > 0) {
          console.log("Success! Sending streamId back to popup");
          sendResponse({ streamId: streamId, recorderTabId: recorderTabId });
        } else {
          console.log("User cancelled or error occurred");
          sendResponse({ streamId: null });
        }
      }
    );

    return true; // Keep message channel open for async response
  }

  if (message.action === "downloadVideo") {
    chrome.downloads.download(
      {
        url: message.url,
        filename: message.filename,
        saveAs: true,
      },
      () => {
        chrome.storage.session.set(CLEARED_RECORDING_STATE);
        setDefaultIcon();
        chrome.runtime.sendMessage({ action: "downloadReady" });
      }
    );
    return false;
  }

  if (message.action === "startAutoTranscription") {
    startTranscription(message.recordingId);
    sendResponse({ success: true, started: true });
    return false;
  }

  if (message.action === "transcribeVideoManual") {
    startTranscription(message.recordingId);
    sendResponse({ success: true, started: true });
    return false;
  }

  if (message.action === "jiraAuth") {
    handleJiraAuth(message, sendResponse);
    return true; // Keep message channel open for async response
  }

  return false;
});

// Save transcript to the recording in storage (called by offscreen via message)
async function saveTranscript(
  recordingId: string,
  transcript: string,
  generatingFilename: boolean
) {
  const result = (await chrome.storage.local.get("recordings")) as any;
  const recordings = result.recordings || [];
  const idx = recordings.findIndex((r: any) => r.id === recordingId);

  if (idx === -1) {
    throw new Error("Recording not found");
  }

  recordings[idx].transcript = transcript;
  recordings[idx].transcribing = false;
  recordings[idx].generatingFilename = generatingFilename;
  await chrome.storage.local.set({ recordings });
  console.log("[Background] Transcript saved for recording:", recordingId);

  // Notify UI
  chrome.runtime.sendMessage({
    action: "transcriptionComplete",
    recordingId,
    transcript,
    generatingFilename,
  });
}

async function saveGeneratedFilename(
  recordingId: string,
  generatedFilename?: string | null
) {
  const result = (await chrome.storage.local.get("recordings")) as any;
  const recordings = result.recordings || [];
  const idx = recordings.findIndex((r: any) => r.id === recordingId);

  if (idx === -1) {
    throw new Error("Recording not found");
  }

  if (generatedFilename) {
    recordings[idx].filename = generatedFilename;
  }
  recordings[idx].generatingFilename = false;
  await chrome.storage.local.set({ recordings });

  chrome.runtime.sendMessage({
    action: "filenameGenerationComplete",
    recordingId,
    generatedFilename,
  });
}

// Clear transcribing flag (called on failure)
async function clearTranscribingFlag(recordingId: string) {
  try {
    const result = (await chrome.storage.local.get("recordings")) as any;
    const recordings = result.recordings || [];
    const idx = recordings.findIndex((r: any) => r.id === recordingId);
    if (idx !== -1) {
      recordings[idx].transcribing = false;
      recordings[idx].generatingFilename = false;
      await chrome.storage.local.set({ recordings });
      console.log("[Background] Cleared transcribing flag for:", recordingId);
    }
  } catch (error) {
    console.error("[Background] Failed to clear transcribing flag:", error);
  }
}

// Start transcription via offscreen document.
async function startTranscription(recordingId: string) {
  try {
    console.log("[Background] Starting transcription for recording:", recordingId);

    // Check if already transcribing
    const result = (await chrome.storage.local.get("recordings")) as any;
    const recordings = result.recordings || [];
    const recording = recordings.find((r: any) => r.id === recordingId);

    if (!recording) {
      throw new Error("Recording not found");
    }

    if (recording.transcribing) {
      console.log("[Background] Transcription already in progress for:", recordingId);
      return;
    }

    // Mark recording as transcribing
    recording.transcribing = true;
    recording.generatingFilename = false;
    await chrome.storage.local.set({ recordings });

    // Notify UI that transcription started
    chrome.runtime.sendMessage({
      action: "transcriptionStarted",
      recordingId,
    });

    // Read summarizer setting and create offscreen document in parallel
    const [settingsResult] = await Promise.all([
      chrome.storage.local.get("summarizerEnabled"),
      setupOffscreenDocument(),
    ]);
    const summarizerEnabled = settingsResult.summarizerEnabled === true;

    // Fire-and-forget: offscreen handles the rest (including persisting the transcript)
    chrome.runtime.sendMessage(
      { action: "transcribeVideo", recordingId, summarizerEnabled },
      () => {
        if (chrome.runtime.lastError) {
          // Expected — channel closes immediately
        }
      }
    );

    console.log("[Background] Transcription request sent to offscreen");
  } catch (error: any) {
    console.error("[Background] Failed to start transcription:", error);

    // Clear transcribing flag so user can retry
    try {
      const result = (await chrome.storage.local.get("recordings")) as any;
      const recordings = result.recordings || [];
      const idx = recordings.findIndex((r: any) => r.id === recordingId);
      if (idx !== -1) {
        recordings[idx].transcribing = false;
        recordings[idx].generatingFilename = false;
        await chrome.storage.local.set({ recordings });
      }
    } catch {
      // best effort
    }
  }
}

// On startup, check for recordings stuck with transcribing=true but no active
// offscreen document processing them (e.g. extension was reloaded mid-transcription).
async function checkStuckTranscriptions() {
  try {
    const result = (await chrome.storage.local.get("recordings")) as any;
    const recordings = result.recordings || [];
    let changed = false;

    for (const recording of recordings) {
      if (recording.transcribing) {
        console.warn("[Background] Found stuck transcription on startup:", recording.id);
        recording.transcribing = false;
        changed = true;
      }
      if (recording.generatingFilename) {
        recording.generatingFilename = false;
        changed = true;
      }
    }

    if (changed) {
      await chrome.storage.local.set({ recordings });
      console.log("[Background] Cleared stuck transcription flags");
    }
  } catch (error) {
    console.error("[Background] Failed to check stuck transcriptions:", error);
  }
}

// Offscreen document management
let offscreenCreating: Promise<void> | null = null;

async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL(
    "src/pages/offscreen/offscreen.html"
  );
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT" as chrome.runtime.ContextType],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  if (offscreenCreating) {
    await offscreenCreating;
  } else {
    offscreenCreating = chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: ["WORKERS" as chrome.offscreen.Reason],
      justification:
        "Transcription runs in a web worker that requires DOM context for audio extraction",
    });

    await offscreenCreating;
    offscreenCreating = null;
  }
}

// Jira Authentication Handler
async function handleJiraAuth(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    const config = {
      clientId: message.config.clientId,
      exchangeUrl: message.config.exchangeUrl,
      redirectUri: chrome.identity.getRedirectURL("oauth2"),
      authUrl: "https://auth.atlassian.com/authorize",
      scope: "read:jira-user read:jira-work write:jira-work offline_access",
    };
    const stateBytes = crypto.getRandomValues(new Uint8Array(32));
    const state = Array.from(stateBytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    // Build OAuth URL
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.append("audience", "api.atlassian.com");
    authUrl.searchParams.append("client_id", config.clientId);
    authUrl.searchParams.append("scope", config.scope);
    authUrl.searchParams.append("redirect_uri", config.redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("prompt", "consent");
    authUrl.searchParams.append("state", state);

    console.log("Starting Jira OAuth flow...");
    console.log("Redirect URI:", config.redirectUri);

    // Launch OAuth flow
    let responseUrl: string | undefined;
    try {
      responseUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl.toString(),
        interactive: true,
      });
    } catch (authError: any) {
      console.error("launchWebAuthFlow failed:", authError.message);
      // Open the auth URL in a regular tab so the user can see the actual error
      chrome.tabs.create({ url: authUrl.toString() });
      throw new Error(
        "The authorization page has been opened in a new tab — please complete the setup there and try connecting again. If you experience issues then please try to logout of any existing Atlassian Account."
      );
    }

    // Extract authorization code from response
    const url = new URL(responseUrl!);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    const oauthError = url.searchParams.get("error");

    if (oauthError) {
      throw new Error(`Atlassian authorization failed: ${oauthError}`);
    }

    if (!returnedState || returnedState !== state) {
      throw new Error("Invalid OAuth state");
    }

    if (!code) {
      throw new Error("No authorization code received");
    }

    console.log("Authorization code received, exchanging for tokens...");

    // Exchange code for tokens
    const tokenResponse = await fetch(config.exchangeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenResponse.status);
      throw new Error(
        `Failed to exchange code for tokens: ${tokenResponse.status}`
      );
    }

    const tokens = await tokenResponse.json();
    if (
      typeof tokens.access_token !== "string" ||
      typeof tokens.refresh_token !== "string" ||
      typeof tokens.expires_in !== "number"
    ) {
      throw new Error("Token exchange returned an invalid response");
    }

    // Get Jira cloud ID and site name
    const resourcesResponse = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
        },
      }
    );

    if (!resourcesResponse.ok) {
      throw new Error(
        `Failed to load accessible Jira sites: ${resourcesResponse.status}`
      );
    }

    const resources = await resourcesResponse.json();
    if (!Array.isArray(resources) || resources.length === 0) {
      throw new Error("No accessible Jira sites found");
    }
    const cloudInfo = {
      cloudId: resources[0].id,
      siteName: resources[0].name,
      siteUrl: resources[0].url,
    };

    // Store tokens
    const jiraTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      cloudId: cloudInfo.cloudId,
      siteName: cloudInfo.siteName,
      siteUrl: cloudInfo.siteUrl,
    };

    await chrome.storage.local.set({ jiraTokens });

    console.log("Jira authentication successful!");
    console.log("Connected to:", cloudInfo.siteName);

    sendResponse({ success: true, tokens: jiraTokens });
  } catch (error: any) {
    console.error("Jira authentication failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}
