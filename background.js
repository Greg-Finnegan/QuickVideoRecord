// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCapture') {
    const recorderTabId = message.recorderTabId;

    if (!recorderTabId) {
      console.error('No recorderTabId provided');
      sendResponse({ streamId: null });
      return true;
    }

    console.log('Requesting desktopCapture for recorder tab:', recorderTabId);

    // The second parameter should be undefined or omitted for side panels/popups
    // chooseDesktopMedia will show the picker in the current window
    chrome.desktopCapture.chooseDesktopMedia(
      ['screen', 'window', 'tab'],
      (streamId) => {
        console.log('DesktopCapture returned streamId:', streamId);
        if (streamId && streamId.length > 0) {
          console.log('Success! Sending streamId back to popup');
          sendResponse({ streamId: streamId, recorderTabId: recorderTabId });
        } else {
          console.log('User cancelled or error occurred');
          sendResponse({ streamId: null });
        }
      }
    );

    return true; // Keep message channel open for async response
  }

  if (message.action === 'downloadVideo') {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      saveAs: true
    }, () => {
      chrome.runtime.sendMessage({ action: 'downloadReady' });
    });
  }

  if (message.action === 'jiraAuth') {
    handleJiraAuth(message, sendResponse);
    return true; // Keep message channel open for async response
  }
});

// Jira Authentication Handler
async function handleJiraAuth(message, sendResponse) {
  try {
    const config = {
      clientId: message.config.clientId,
      clientSecret: message.config.clientSecret,
      redirectUri: chrome.identity.getRedirectURL("oauth2"),
      authUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      scope: "read:jira-user read:jira-work write:jira-work offline_access"
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
    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });

    // Extract authorization code from response
    const url = new URL(responseUrl);
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
      throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status}`);
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
  } catch (error) {
    console.error("Jira authentication failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}
