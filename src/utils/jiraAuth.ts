import { Version3Client } from "jira.js";
import type { JiraTokens, JiraOAuthConfig } from "../types";

// Jira OAuth Configuration
const getJiraConfig = (): JiraOAuthConfig => ({
  clientId: import.meta.env.VITE_JIRA_CLIENT_ID,
  clientSecret: import.meta.env.VITE_JIRA_CLIENT_SECRET,
  redirectUri: chrome.identity?.getRedirectURL("oauth2") || "",
  authUrl: "https://auth.atlassian.com/authorize",
  tokenUrl: "https://auth.atlassian.com/oauth/token",
  scope: "read:jira-user read:jira-work write:jira-work offline_access",
});

class JiraAuthService {
  async authenticate(): Promise<boolean> {
    try {
      const config = getJiraConfig();

      // Send message to background script to handle OAuth flow
      const response = await chrome.runtime.sendMessage({
        action: "jiraAuth",
        config: {
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        },
      });

      if (response.success) {
        console.log("Jira authentication successful!");
        return true;
      } else {
        console.error("Jira authentication failed:", response.error);
        return false;
      }
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
      const tokens = result.jiraTokens as JiraTokens | undefined;

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
      const config = getJiraConfig();
      const result = await chrome.storage.local.get("jiraTokens");
      const tokens = result.jiraTokens as JiraTokens | undefined;

      if (!tokens || !tokens.refreshToken) {
        return false;
      }

      const refreshParams = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: tokens.refreshToken,
      });

      const response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: refreshParams.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Token refresh failed:", response.status, errorText);
        throw new Error(
          `Failed to refresh token: ${response.status} ${errorText}`
        );
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
    return (result.jiraTokens as JiraTokens) || null;
  }

  async getAccessToken(): Promise<string | null> {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      return null;
    }

    const tokens = await this.getTokens();
    return tokens?.accessToken || null;
  }

  async getClient(): Promise<Version3Client | null> {
    const tokens = await this.getTokens();
    if (!tokens || !tokens.accessToken || !tokens.cloudId) {
      console.error("Missing tokens or cloudId for Jira client");
      return null;
    }

    // Ensure token is not expired
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      console.error("Token is expired and could not be refreshed");
      return null;
    }

    // Get fresh tokens after potential refresh
    const freshTokens = await this.getTokens();
    if (!freshTokens) {
      return null;
    }

    return new Version3Client({
      host: `https://api.atlassian.com/ex/jira/${freshTokens.cloudId}`,
      authentication: {
        oauth2: {
          accessToken: freshTokens.accessToken,
        },
      },
    });
  }
}

export const jiraAuth = new JiraAuthService();

// Re-export types for convenience
export type { JiraTokens, JiraOAuthConfig };
