import type { GeminiTokens, GeminiOAuthConfig } from "../types";

// Gemini OAuth Configuration
const getGeminiConfig = (): GeminiOAuthConfig => ({
  clientId: import.meta.env.VITE_GEMINI_CLIENT_ID,
  scopes: ["https://www.googleapis.com/auth/generative-language.retriever"],
});

class GeminiAuthService {
  /**
   * Authenticate with Google using chrome.identity API
   * Simpler than Jira - Chrome handles the OAuth flow automatically
   */
  async authenticate(): Promise<boolean> {
    try {
      const config = getGeminiConfig();

      // Send message to background script to handle OAuth flow
      const response = await chrome.runtime.sendMessage({
        action: "geminiAuth",
        config: {
          clientId: config.clientId,
          scopes: config.scopes,
        },
      });

      if (response.success) {
        console.log("Gemini authentication successful!");
        return true;
      } else {
        console.error("Gemini authentication failed:", response.error);
        return false;
      }
    } catch (error) {
      console.error("Gemini authentication failed:", error);
      return false;
    }
  }

  /**
   * Check if user is authenticated with valid token
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get("geminiTokens");
      const tokens = result.geminiTokens as GeminiTokens | undefined;

      if (!tokens) {
        return false;
      }

      // Check if token is expired
      if (Date.now() >= tokens.expiresAt) {
        console.log("Token expired, attempting to get new token...");
        // Try to get a fresh token (Chrome will handle refresh)
        return await this.refreshToken();
      }

      return true;
    } catch (error) {
      console.error("Failed to check authentication status:", error);
      return false;
    }
  }

  /**
   * Get a fresh token (Chrome handles refresh automatically)
   */
  async refreshToken(): Promise<boolean> {
    try {
      // chrome.identity.getAuthToken will automatically refresh if needed
      const response = await chrome.runtime.sendMessage({
        action: "geminiRefreshToken",
      });

      if (response.success) {
        console.log("Token refreshed successfully");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  }

  /**
   * Disconnect and revoke access
   */
  async disconnect(): Promise<void> {
    try {
      // Get current token to revoke it
      const tokens = await this.getTokens();

      if (tokens?.accessToken) {
        // Remove cached token from Chrome
        await chrome.runtime.sendMessage({
          action: "geminiRevoke",
          token: tokens.accessToken,
        });
      }

      // Clear stored tokens
      await chrome.storage.local.remove("geminiTokens");
      console.log("Disconnected from Gemini");
    } catch (error) {
      console.error("Error during disconnect:", error);
      // Still clear local storage even if revoke fails
      await chrome.storage.local.remove("geminiTokens");
    }
  }

  /**
   * Get stored tokens
   */
  async getTokens(): Promise<GeminiTokens | null> {
    const result = await chrome.storage.local.get("geminiTokens");
    return (result.geminiTokens as GeminiTokens) || null;
  }

  /**
   * Get a valid access token, refreshing if needed
   */
  async getAccessToken(): Promise<string | null> {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      return null;
    }

    const tokens = await this.getTokens();
    return tokens?.accessToken || null;
  }
}

export const geminiAuth = new GeminiAuthService();

// Re-export types for convenience
export type { GeminiTokens, GeminiOAuthConfig };
