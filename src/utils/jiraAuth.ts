// Jira OAuth Configuration
const JIRA_CONFIG = {
  clientId: import.meta.env.VITE_JIRA_CLIENT_ID,
  clientSecret: import.meta.env.VITE_JIRA_CLIENT_SECRET,
  redirectUri: chrome.identity.getRedirectURL("oauth2"),
  authUrl: "https://auth.atlassian.com/authorize",
  tokenUrl: "https://auth.atlassian.com/oauth/token",
  scope: "read:jira-user read:jira-work write:jira-work offline_access",
};

interface JiraTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  cloudId?: string;
  siteName?: string;
}

class JiraAuthService {
  async authenticate(): Promise<boolean> {
    try {
      // Build OAuth URL
      const authUrl = new URL(JIRA_CONFIG.authUrl);
      authUrl.searchParams.append("audience", "api.atlassian.com");
      authUrl.searchParams.append("client_id", JIRA_CONFIG.clientId);
      authUrl.searchParams.append("scope", JIRA_CONFIG.scope);
      authUrl.searchParams.append("redirect_uri", JIRA_CONFIG.redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("prompt", "consent");

      console.log("Starting Jira OAuth flow...");
      console.log("Redirect URI:", JIRA_CONFIG.redirectUri);

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
        client_id: JIRA_CONFIG.clientId,
        client_secret: JIRA_CONFIG.clientSecret,
        code: code,
        redirect_uri: JIRA_CONFIG.redirectUri,
      });

      const tokenResponse = await fetch(JIRA_CONFIG.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", tokenResponse.status, errorText);
        throw new Error(`Failed to exchange code for tokens: ${tokenResponse.status} ${errorText}`);
      }

      const tokens = await tokenResponse.json();

      // Get Jira cloud ID and site name
      const cloudInfo = await this.getAccessibleResources(tokens.access_token);

      // Store tokens
      const jiraTokens: JiraTokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        cloudId: cloudInfo?.cloudId,
        siteName: cloudInfo?.siteName,
      };

      await chrome.storage.local.set({ jiraTokens });

      console.log("Jira authentication successful!");
      console.log("Connected to:", cloudInfo?.siteName);

      return true;
    } catch (error) {
      console.error("Jira authentication failed:", error);
      return false;
    }
  }

  async getAccessibleResources(
    accessToken: string
  ): Promise<{ cloudId: string; siteName: string } | null> {
    try {
      const response = await fetch(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get accessible resources");
      }

      const resources = await response.json();

      if (resources.length === 0) {
        throw new Error("No Jira sites found");
      }

      // Use the first site (you can let users choose if multiple sites)
      return {
        cloudId: resources[0].id,
        siteName: resources[0].name,
      };
    } catch (error) {
      console.error("Failed to get Jira resources:", error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get("jiraTokens");
      const tokens: JiraTokens | undefined = result.jiraTokens;

      if (!tokens) {
        return false;
      }

      // Check if token is expired
      if (Date.now() >= tokens.expiresAt) {
        console.log("Token expired, attempting refresh...");
        return await this.refreshToken();
      }

      return true;
    } catch (error) {
      console.error("Failed to check authentication status:", error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get("jiraTokens");
      const tokens: JiraTokens | undefined = result.jiraTokens;

      if (!tokens || !tokens.refreshToken) {
        return false;
      }

      const refreshParams = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: JIRA_CONFIG.clientId,
        client_secret: JIRA_CONFIG.clientSecret,
        refresh_token: tokens.refreshToken,
      });

      const response = await fetch(JIRA_CONFIG.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: refreshParams.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Token refresh failed:", response.status, errorText);
        throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
      }

      const newTokens = await response.json();

      const updatedTokens: JiraTokens = {
        ...tokens,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresAt: Date.now() + newTokens.expires_in * 1000,
      };

      await chrome.storage.local.set({ jiraTokens: updatedTokens });

      console.log("Token refreshed successfully");
      return true;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await chrome.storage.local.remove("jiraTokens");
    console.log("Disconnected from Jira");
  }

  async getTokens(): Promise<JiraTokens | null> {
    const result = await chrome.storage.local.get("jiraTokens");
    return result.jiraTokens || null;
  }

  async getAccessToken(): Promise<string | null> {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      return null;
    }

    const tokens = await this.getTokens();
    return tokens?.accessToken || null;
  }
}

export const jiraAuth = new JiraAuthService();
export type { JiraTokens };
