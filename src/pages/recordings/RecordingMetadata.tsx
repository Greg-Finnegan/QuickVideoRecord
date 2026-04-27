import React from "react";
import type { Recording } from "../../types";
import Icon from "../../components/Icon";

interface RecordingMetadataProps {
  recording: Recording;
  formatDate: (timestamp: number) => string;
  formatSize: (bytes?: number) => string;
  formatDuration: (seconds?: number) => string;
}

const RecordingMetadata: React.FC<RecordingMetadataProps> = ({
  recording,
  formatDate,
  formatSize,
  formatDuration,
}) => {
  return (
    <div
      className="xl:flex-1 min-w-0"
    >
      <h3 className="m-0 mb-2 text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
        {recording.filename}
      </h3>
      <div className="flex flex-wrap gap-4">
        <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <Icon name="calendar" size={14} /> {formatDate(recording.timestamp)}
        </span>
        {recording.duration && (
          <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Icon name="timer" size={14} /> {formatDuration(recording.duration)}
          </span>
        )}
        {recording.size && (
          <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Icon name="save" size={14} /> {formatSize(recording.size)}
          </span>
        )}
        {recording.transcribing && (
          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Icon name="mic" size={14} /> Transcribing...
          </span>
        )}
        {recording.transcript && !recording.transcribing && (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <Icon name="check" size={14} /> Transcribed
          </span>
        )}
      </div>
    </div>
  );
};

export default RecordingMetadata;
