export interface JiraDraft {
  projectKey?: string;
  issueTypeName?: string;
  summary?: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  sprintId?: string;
  labelsInput?: string;
  attachVideo?: boolean;
}

export interface Recording {
  id: string;
  filename: string;
  timestamp: number;
  duration?: number;
  size?: number;
  transcript?: string;
  transcribing?: boolean;
  jiraIssueKey?: string;
  jiraIssueUrl?: string;
  downloadId?: number; // Chrome download ID for instant "Show in Finder"
  jiraDraft?: JiraDraft;
}

export interface RecordingStorage {
  recordings?: Recording[];
}

// Transcription job tracking types (survives service worker termination)
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TranscriptionJob {
  recordingId: string;
  status: TranscriptionStatus;
  progress: number;
  statusMessage: string;
  startedAt: number;
  updatedAt: number;
  error?: string;
  transcript?: string;
}

export interface TranscriptionJobsStorage {
  transcriptionJobs?: { [recordingId: string]: TranscriptionJob };
}

// Session storage state for tracking active recording across side panel lifecycle
export interface RecordingSessionState {
  isRecording: boolean;
  recorderTabId: number | null;
}
