/**
 * Centralized type exports for the extension
 * Import types like: import { Recording, JiraTokens, ThemeOption } from '@/types'
 */

// Recording types
export type {
  Recording,
  RecordingStorage,
  RecordingSessionState,
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
  AiProvider,
  AiProviderConfig,
} from "./extensionSettings";

// Re-export default settings and constants
export {
  DEFAULT_EXTENSION_SETTINGS,
  DEFAULT_AI_PROMPT,
  DEFAULT_AI_PROVIDER,
  AI_PROVIDER_CONFIG,
} from "./extensionSettings";
