// Background service worker for Chrome Window Recorder
console.log("Background service worker loaded");

// On startup, check for any recordings stuck in transcribing state
checkStuckTranscriptions();

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Forward transcription progress messages (best-effort from offscreen)
  if (message.action === "transcriptionProgress") {
    return false;
  }

  // Save transcript from offscreen document to the recording in storage
  if (message.action === "saveTranscript") {
    saveTranscript(message.recordingId, message.transcript)
      .then(() => sendResponse({ success: true }))
      .catch((err: any) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }

  // Handle transcription failure from offscreen document
  if (message.action === "transcriptionFailed") {
    clearTranscribingFlag(message.recordingId);
    return false;
  }

  // Close offscreen document when transcription is done
  if (message.action === "closeOffscreen") {
    chrome.offscreen.closeDocument().catch(() => {});
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

  if (message.action === "geminiAuth") {
    handleGeminiAuth(message, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (message.action === "geminiRefreshToken") {
    handleGeminiRefresh(sendResponse);
    return true;
  }

  if (message.action === "geminiRevoke") {
    handleGeminiRevoke(message, sendResponse);
    return true;
  }

  return false;
});

// Save transcript to the recording in storage (called by offscreen via message)
async function saveTranscript(recordingId: string, transcript: string) {
  const result = (await chrome.storage.local.get("recordings")) as any;
  const recordings = result.recordings || [];
  const idx = recordings.findIndex((r: any) => r.id === recordingId);

  if (idx === -1) {
    throw new Error("Recording not found");
  }

  recordings[idx].transcript = transcript;
  recordings[idx].transcribing = false;
  await chrome.storage.local.set({ recordings });
  console.log("[Background] Transcript saved for recording:", recordingId);

  // Notify UI
  chrome.runtime.sendMessage({
    action: "transcriptionComplete",
    recordingId,
    transcript,
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
    await chrome.storage.local.set({ recordings });

    // Notify UI that transcription started
    chrome.runtime.sendMessage({
      action: "transcriptionStarted",
      recordingId,
    });

    // Create offscreen document if it doesn't exist
    await setupOffscreenDocument();

    // Fire-and-forget: offscreen handles the rest (including persisting the transcript)
    chrome.runtime.sendMessage(
      { action: "transcribeVideo", recordingId },
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
      clientSecret: message.config.clientSecret,
      redirectUri: chrome.identity.getRedirectURL("oauth2"),
      authUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      scope: "read:jira-user read:jira-work write:jira-work offline_access",
    };

    // Build OAuth URL
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.append("audience", "api.atlassian.com");
    authUrl.searchParams.append("client_id", config.clientId);
    authUrl.searchParams.append("scope", config.scope);
    authUrl.searchParams.append("redirect_uri", config.redirectUri);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("prompt", "consent");

    console.log("Starting Jira OAuth flow...");
    console.log("Redirect URI:", config.redirectUri);

    // Launch OAuth flow
    const responseUrl: string | undefined = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });

    // Extract authorization code from response
    const url = new URL(responseUrl!);
    const code = url.searchParams.get("code");

    if (!code) {
      throw new Error("No authorization code received");
    }

    console.log("Authorization code received, exchanging for tokens...");

    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
    });

    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errorText);
      throw new Error(
        `Failed to exchange code for tokens: ${tokenResponse.status}`
      );
    }

    const tokens = await tokenResponse.json();

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

    let cloudInfo = null;
    if (resourcesResponse.ok) {
      const resources = await resourcesResponse.json();
      if (resources.length > 0) {
        cloudInfo = {
          cloudId: resources[0].id,
          siteName: resources[0].name,
        };
      }
    }

    // Store tokens
    const jiraTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      cloudId: cloudInfo?.cloudId,
      siteName: cloudInfo?.siteName,
    };

    await chrome.storage.local.set({ jiraTokens });

    console.log("Jira authentication successful!");
    console.log("Connected to:", cloudInfo?.siteName);

    sendResponse({ success: true, tokens: jiraTokens });
  } catch (error: any) {
    console.error("Jira authentication failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Gemini Authentication Handlers

/**
 * Handle Gemini authentication using chrome.identity API
 */
async function handleGeminiAuth(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    console.log("Starting Gemini OAuth flow...");

    // Use chrome.identity.getAuthToken for Google OAuth
    // This is simpler than Jira's launchWebAuthFlow
    const token = await chrome.identity.getAuthToken({
      interactive: true, // Show UI popup if needed
    });

    if (!token) {
      throw new Error("No token received from Google");
    }

    console.log("Access token received");

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let email = undefined;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      email = userInfo.email;
    }

    // Store tokens
    const geminiTokens = {
      accessToken: token,
      // Chrome doesn't provide expiry info, estimate 1 hour
      expiresAt: Date.now() + 3600 * 1000,
      email: email,
      scopes: message.config.scopes,
    };

    await chrome.storage.local.set({ geminiTokens });

    console.log("Gemini authentication successful!");
    if (email) {
      console.log("Connected as:", email);
    }

    sendResponse({ success: true, tokens: geminiTokens });
  } catch (error: any) {
    console.error("Gemini authentication failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Refresh Gemini token using chrome.identity
 */
async function handleGeminiRefresh(sendResponse: (response: any) => void) {
  try {
    // Remove cached token to force refresh
    const result = await chrome.storage.local.get("geminiTokens");
    const oldTokens = result.geminiTokens;

    // @ts-ignore
    if (oldTokens?.accessToken) {
      await chrome.identity.removeCachedAuthToken({
        // @ts-ignore
        token: oldTokens.accessToken,
      });
    }

    // Get new token (non-interactive, use cached credentials)
    const token = await chrome.identity.getAuthToken({
      interactive: false,
    });

    if (!token) {
      throw new Error("Failed to refresh token");
    }

    const geminiTokens = {
      accessToken: token,
      expiresAt: Date.now() + 3600 * 1000,
      // @ts-ignore
      email: oldTokens?.email,
      // @ts-ignore
      scopes: oldTokens?.scopes || [],
    };

    await chrome.storage.local.set({ geminiTokens });

    sendResponse({ success: true });
  } catch (error: any) {
    console.error("Token refresh failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Revoke Gemini token
 */
async function handleGeminiRevoke(
  message: any,
  sendResponse: (response: any) => void
) {
  try {
    // Remove from Chrome's cache
    await chrome.identity.removeCachedAuthToken({
      token: message.token,
    });

    // Optionally revoke on Google's side
    try {
      await fetch(
        `https://accounts.google.com/o/oauth2/revoke?token=${message.token}`,
        { method: "POST" }
      );
    } catch (revokeError) {
      console.warn("Failed to revoke token on Google side:", revokeError);
      // Continue anyway - local removal is more important
    }

    sendResponse({ success: true });
  } catch (error: any) {
    console.error("Token revocation failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}
