/**
 * Gemini OAuth tokens and authentication data
 * Simpler than Jira because chrome.identity handles refresh automatically
 */
export interface GeminiTokens {
  accessToken: string;
  expiresAt: number; // Timestamp when token expires
  email?: string; // User's Google email
  scopes: string[]; // Granted scopes
}

/**
 * Gemini OAuth configuration
 */
export interface GeminiOAuthConfig {
  clientId: string;
  scopes: string[];
}

/**
 * Storage structure for Gemini settings
 */
export interface GeminiSettingsStorage {
  geminiTokens?: GeminiTokens;
}

/**
 * Gemini integration status
 */
export interface GeminiIntegrationStatus {
  isConnected: boolean;
  email?: string;
  scopes?: string[];
  lastSync?: number;
}

/**
 * Gemini API request/response types
 */
export interface GeminiGenerateRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiGenerateResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Parameters for AI-generated Jira issue descriptions
 */
export interface GenerateDescriptionParams {
  recordingTitle: string;
  transcript?: string;
  additionalContext?: string;
}
