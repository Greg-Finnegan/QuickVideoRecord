export interface Recording {
  id: string;
  filename: string;
  timestamp: number;
  duration?: number;
  size?: number;
}

export interface RecordingStorage {
  recordings?: Recording[];
}
