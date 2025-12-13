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
 * Storage structure for extension settings
 */
export interface ExtensionSettingsStorage {
  themePreference?: ThemeOption;
  recordingSettings?: RecordingSettings;
  transcriptionSettings?: TranscriptionSettings;
  notificationSettings?: NotificationSettings;
}

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
