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
}

export interface RecordingStorage {
  recordings?: Recording[];
}
