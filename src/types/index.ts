/**
 * Centralized type exports for the extension
 * Import types like: import { Recording, JiraTokens, ThemeOption } from '@/types'
 */

// Recording types
export type {
  Recording,
  RecordingStorage,
} from "./recording";

// Jira settings types
export type {
  JiraTokens,
  JiraOAuthConfig,
  JiraAccessibleResource,
  JiraProjectSettings,
  JiraIssueParams,
  JiraSettingsStorage,
  JiraProjectOption,
  JiraIntegrationStatus,
  JiraSprint,
  JiraSprintOption,
} from "./jiraSettings";

// Jira issue creation types
export type {
  CreateIssueFormData,
  CreateIssueResult,
} from "./jiraIssue";

// Gemini settings types
export type {
  GeminiTokens,
  GeminiOAuthConfig,
  GeminiSettingsStorage,
  GeminiIntegrationStatus,
  GeminiGenerateRequest,
  GeminiGenerateResponse,
  GenerateDescriptionParams,
} from "./geminiSettings";

// Toast notification types
export type {
  Toast,
  ToastLink,
} from "./toast";

// Extension settings types
export type {
  ThemeOption,
  AppliedTheme,
  RecordingQuality,
  FrameRate,
  VideoCodec,
  RecordingSettings,
  TranscriptionSettings,
  NotificationSettings,
  ExtensionSettings,
  ExtensionSettingsStorage,
  ExtensionVersion,
  ExtensionState,
} from "./extensionSettings";

// Re-export default settings
export { DEFAULT_EXTENSION_SETTINGS } from "./extensionSettings";
