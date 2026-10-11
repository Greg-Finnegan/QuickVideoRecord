/**
 * Centralized type exports for the extension
 * Import types like: import { Recording, JiraTokens, ThemeOption } from '@/types'
 */

// Recording types
export type {
  Recording,
  RecordingStorage,
  RecordingSessionState,
  JiraDraft,
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
  AiApiProvider,
  ActiveAiApiProvider,
  AiApiProviderConfig,
  AiApiConfig,
  AiTicketDraft,
} from "./extensionSettings";

// Side panel message types
export type {
  OpenSidePanelMessage,
  ToggleSidePanelMessage,
  CloseSidePanelMessage,
  SidePanelMessage,
} from "./messages";

export { isCloseSidePanelMessage } from "./messages";

// Re-export default settings and constants
export {
  DEFAULT_EXTENSION_SETTINGS,
  DEFAULT_AI_PROMPT,
  DEFAULT_AI_PROVIDER,
  AI_PROVIDER_CONFIG,
  AI_API_PROVIDER_CONFIG,
  isActiveAiApiProvider,
} from "./extensionSettings";
