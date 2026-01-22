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
}

export interface RecordingStorage {
  recordings?: Recording[];
}
