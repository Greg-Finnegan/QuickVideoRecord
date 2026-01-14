// Background service worker for Chrome Window Recorder

console.log("Background service worker loaded");

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward transcription progress messages to all tabs
  if (message.action === "transcriptionProgress") {
    // Just forward the message - don't need to do anything else
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
    handleAutoTranscription(message.recordingId);
    // Don't wait for response - transcription happens in background
    sendResponse({ success: true, started: true });
    return false;
  }

  if (message.action === "transcribeVideoManual") {
    handleManualTranscription(message.recordingId);
    // Don't wait for response - transcription happens in background
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

// Manual transcription Handler (triggered from UI)
async function handleManualTranscription(recordingId: string) {
  try {
    console.log("Starting manual transcription for recording:", recordingId);

    // Mark recording as transcribing in storage
    const result = (await chrome.storage.local.get("recordings")) as any;
    const recordings = result.recordings || [];
    const recordingIndex = recordings.findIndex(
      (r: any) => r.id === recordingId
    );

    if (recordingIndex === -1) {
      throw new Error("Recording not found");
    }

    recordings[recordingIndex].transcribing = true;
    await chrome.storage.local.set({ recordings });

    // Notify UI that transcription started
    chrome.runtime.sendMessage({
      action: "transcriptionStarted",
      recordingId: recordingId,
    });

    // Create offscreen document if it doesn't exist
    await setupOffscreenDocument();

    // Send transcription request to offscreen document and wait for response
    const response = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "transcribeVideo",
          recordingId: recordingId,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            resolve({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response && response.success) {
      // Update recording with transcript
      const updatedResult = (await chrome.storage.local.get(
        "recordings"
      )) as any;
      const updatedRecordings = updatedResult.recordings || [];
      const updatedIndex = updatedRecordings.findIndex(
        (r: any) => r.id === recordingId
      );

      if (updatedIndex !== -1) {
        updatedRecordings[updatedIndex].transcript = response.transcript;
        updatedRecordings[updatedIndex].transcribing = false;
        await chrome.storage.local.set({ recordings: updatedRecordings });
      }

      // Notify UI that transcription is complete
      chrome.runtime.sendMessage({
        action: "transcriptionComplete",
        recordingId: recordingId,
        transcript: response.transcript,
      });

      console.log("Manual transcription completed successfully");
    } else {
      throw new Error(response?.error || "Transcription failed");
    }
  } catch (error: any) {
    console.error("Manual transcription handler failed:", error);
    await markTranscriptionFailed(recordingId, error.message);
  }
}

// Auto-transcription Handler
async function handleAutoTranscription(recordingId: string) {
  try {
    console.log("Starting auto-transcription for recording:", recordingId);

    // Mark recording as transcribing in storage
    const result = (await chrome.storage.local.get("recordings")) as any;
    const recordings = result.recordings || [];
    const recordingIndex = recordings.findIndex(
      (r: any) => r.id === recordingId
    );

    if (recordingIndex === -1) {
      throw new Error("Recording not found");
    }

    recordings[recordingIndex].transcribing = true;
    await chrome.storage.local.set({ recordings });

    // Notify UI that transcription started
    chrome.runtime.sendMessage({
      action: "transcriptionStarted",
      recordingId: recordingId,
    });

    // Create offscreen document if it doesn't exist
    await setupOffscreenDocument();

    // Send transcription request to offscreen document and wait for response
    const response = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "transcribeVideo",
          recordingId: recordingId,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            resolve({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response && response.success) {
      // Update recording with transcript
      const updatedResult = (await chrome.storage.local.get(
        "recordings"
      )) as any;
      const updatedRecordings = updatedResult.recordings || [];
      const updatedIndex = updatedRecordings.findIndex(
        (r: any) => r.id === recordingId
      );

      if (updatedIndex !== -1) {
        updatedRecordings[updatedIndex].transcript = response.transcript;
        updatedRecordings[updatedIndex].transcribing = false;
        await chrome.storage.local.set({ recordings: updatedRecordings });
      }

      // Notify UI that transcription is complete
      chrome.runtime.sendMessage({
        action: "transcriptionComplete",
        recordingId: recordingId,
        transcript: response.transcript,
      });

      console.log("Auto-transcription completed successfully");
    } else {
      throw new Error(response?.error || "Transcription failed");
    }
  } catch (error: any) {
    console.error("Auto-transcription handler failed:", error);
    await markTranscriptionFailed(recordingId, error.message);
  }
}

// Helper to mark transcription as failed
async function markTranscriptionFailed(
  recordingId: string,
  errorMessage: string
) {
  try {
    const result = (await chrome.storage.local.get("recordings")) as any;
    const recordings = result.recordings || [];
    const recordingIndex = recordings.findIndex(
      (r: any) => r.id === recordingId
    );

    if (recordingIndex !== -1) {
      recordings[recordingIndex].transcribing = false;
      await chrome.storage.local.set({ recordings });
    }
  } catch (storageError) {
    console.error("Failed to update recording status:", storageError);
  }

  // Notify UI that transcription failed
  chrome.runtime.sendMessage({
    action: "transcriptionFailed",
    recordingId: recordingId,
    error: errorMessage,
  });
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
      reasons: ["AUDIO_PLAYBACK" as chrome.offscreen.Reason],
      justification:
        "Transcription requires audio processing with Web Audio API",
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
    const responseUrl : string | undefined = await chrome.identity.launchWebAuthFlow({
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
