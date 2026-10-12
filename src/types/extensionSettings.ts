/**
 * Theme preference options
 */
export type ThemeOption = "light" | "dark" | "system";

/**
 * Applied theme (resolved from system preference if needed)
 */
export type AppliedTheme = "light" | "dark";

/**
 * Recording quality presets
 */
export type RecordingQuality = "1080p" | "720p" | "480p";

/**
 * Recording frame rate options
 */
export type FrameRate = 30 | 60;

/**
 * Video codec options
 */
export type VideoCodec = "vp9" | "vp8" | "h264";

/**
 * Recording settings
 */
export interface RecordingSettings {
  quality: RecordingQuality;
  frameRate: FrameRate;
  codec: VideoCodec;
  includeSystemAudio: boolean;
  includeMicrophone: boolean;
  maxRecordingDuration?: number; // in seconds, undefined = unlimited
  autoDeleteAfterDays?: number; // undefined = never delete
}

/**
 * Transcription settings
 */
export interface TranscriptionSettings {
  autoTranscribe: boolean;
  language?: string;
  includeTimestamps?: boolean;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  showRecordingStarted: boolean;
  showRecordingStopped: boolean;
  showDownloadComplete: boolean;
  showErrors: boolean;
}

/**
 * All extension settings combined
 */
export interface ExtensionSettings {
  theme: ThemeOption;
  recording: RecordingSettings;
  transcription: TranscriptionSettings;
  notifications: NotificationSettings;
}

/**
 * AI provider options
 */
export type AiProvider = "off" | "chatgpt" | "claude" | "gemini" | "deepseek" | "perplexity";

export interface AiProviderConfig {
  label: string;
  urlPrefix: string;
  clipboardOnly?: boolean;
  baseUrl?: string;
}

export const AI_PROVIDER_CONFIG: Record<AiProvider, AiProviderConfig> = {
  chatgpt: {
    label: "ChatGPT",
    urlPrefix: "https://chatgpt.com/?q=",
  },
  claude: {
    label: "Claude",
    urlPrefix: "https://claude.ai/new?q=",
  },
  gemini: {
    label: "Gemini",
    urlPrefix: "https://gemini.google.com/app?q=",
    clipboardOnly: true,
    baseUrl: "https://gemini.google.com/app",
  },
  deepseek: {
    label: "DeepSeek",
    urlPrefix: "https://chat.deepseek.com/?q=",
    clipboardOnly: true,
    baseUrl: "https://chat.deepseek.com/",
  },
  perplexity: {
    label: "Perplexity",
    urlPrefix: "https://www.perplexity.ai/search/new?q=",
  },
  // Hides the "Open in" button
  off: {
    label: "Off",
    urlPrefix: "",
  },
};

export const DEFAULT_AI_PROVIDER: AiProvider = "chatgpt";

/**
 * Direct API provider used for automatic filename + Jira draft generation.
 * "off" falls back to Chrome's built-in Summarizer (if enabled).
 */
export type AiApiProvider =
  | "off"
  | "openai"
  | "anthropic"
  | "xai"
  | "moonshot"
  | "gemini"
  | "openrouter";

export type ActiveAiApiProvider = Exclude<AiApiProvider, "off">;

export interface AiApiProviderConfig {
  label: string;
  defaultModel: string;
  /** Requested via optional_host_permissions when a key is saved */
  origin: string;
}

export const AI_API_PROVIDER_CONFIG: Record<ActiveAiApiProvider, AiApiProviderConfig> = {
  openai: { label: "OpenAI", defaultModel: "gpt-6-luna", origin: "https://api.openai.com/*" },
  anthropic: { label: "Anthropic", defaultModel: "claude-haiku-5-5", origin: "https://api.anthropic.com/*" },
  xai: { label: "Grok (xAI)", defaultModel: "grok-4", origin: "https://api.x.ai/*" },
  moonshot: { label: "Kimi (Moonshot)", defaultModel: "kimi-k2.6", origin: "https://api.moonshot.ai/*" },
  gemini: { label: "Gemini", defaultModel: "gemini-3.7-flash", origin: "https://generativelanguage.googleapis.com/*" },
  openrouter: { label: "OpenRouter", defaultModel: "openai/gpt-5.4-mini", origin: "https://openrouter.ai/*" },
};

export const isActiveAiApiProvider = (value: unknown): value is ActiveAiApiProvider =>
  typeof value === "string" && value in AI_API_PROVIDER_CONFIG;

/** What the offscreen document needs to call the API (passed from background). */
export interface AiApiConfig {
  provider: ActiveAiApiProvider;
  apiKey: string;
  model: string;
  prompt: string;
}

/** Structured response we require from the API. */
export interface AiTicketDraft {
  title: string;
  description: string;
}

/**
 * Storage structure for extension settings
 */
export interface ExtensionSettingsStorage {
  themePreference?: ThemeOption;
  recordingSettings?: RecordingSettings;
  transcriptionSettings?: TranscriptionSettings;
  notificationSettings?: NotificationSettings;
  chatGptPrompt?: string;
  aiProvider?: AiProvider;
  summarizerEnabled?: boolean;
  aiApiProvider?: AiApiProvider;
  aiApiKeys?: Partial<Record<ActiveAiApiProvider, string>>;
  aiApiModels?: Partial<Record<ActiveAiApiProvider, string>>;
  devMode?: boolean;
  micDeviceId?: string;
}

/**
 * Default prompt prepended to transcripts
 */
export const DEFAULT_AI_PROMPT =
  "short hand cliff notes and make name for this dev ticket - below is the transcript describing the bug/ticket";

/**
 * Default extension settings
 */
export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  theme: "system",
  recording: {
    quality: "1080p",
    frameRate: 30,
    codec: "vp9",
    includeSystemAudio: true,
    includeMicrophone: true,
  },
  transcription: {
    autoTranscribe: false,
    language: "en",
    includeTimestamps: true,
  },
  notifications: {
    showRecordingStarted: true,
    showRecordingStopped: true,
    showDownloadComplete: true,
    showErrors: true,
  },
};

/**
 * Extension version info
 */
export interface ExtensionVersion {
  version: string;
  buildDate?: string;
  environment?: "development" | "production";
}

/**
 * Extension state
 */
export interface ExtensionState {
  isRecording: boolean;
  currentRecordingId?: string;
  lastError?: string;
}
