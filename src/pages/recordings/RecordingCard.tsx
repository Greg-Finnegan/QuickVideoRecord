import React from "react";
import Button from "../../components/Button";
import ContextMenu from "../../components/ContextMenu";
import { Recording } from "../../types/recording";

interface RecordingCardProps {
  recording: Recording;
  renamingId: string | null;
  newFilename: string;
  onFilenameChange: (filename: string) => void;
  onRename: (id: string) => void;
  onCancelRename: () => void;
  onStartRename: (recording: Recording) => void;
  onPlay: (recording: Recording) => void;
  onDelete: (id: string) => void;
  onCreateJiraIssue?: (recording: Recording) => void;
  onUnlinkJiraIssue?: (recordingId: string) => void;
  isJiraConnected?: boolean;
  formatDate: (timestamp: number) => string;
  formatSize: (bytes?: number) => string;
  formatDuration: (seconds?: number) => string;
}

const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  renamingId,
  newFilename,
  onFilenameChange,
  onRename,
  onCancelRename,
  onStartRename,
  onPlay,
  onDelete,
  onCreateJiraIssue,
  onUnlinkJiraIssue,
  isJiraConnected,
  formatDate,
  formatSize,
  formatDuration,
}) => {
  return (
    <div
      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-4 flex items-center gap-4 transition-all hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
    >
      <div className="text-[32px] flex-shrink-0">🎥</div>
      {renamingId === recording.id ? (
        <>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <input
              type="text"
              value={newFilename}
              onChange={(e) => onFilenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onRename(recording.id);
                } else if (e.key === "Escape") {
                  onCancelRename();
                }
              }}
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <Button
            variant="primary"
            rounded="full"
            className="px-3 py-2 text-sm flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onRename(recording.id);
            }}
            title="Save new name"
          >
            Save
          </Button>
          <Button
            variant="ghost"
            rounded="full"
            className="bg-transparent px-3 py-2 text-sm flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onCancelRename();
            }}
            title="Cancel rename"
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onPlay(recording)}
          >
            <h3 className="m-0 mb-2 text-sm font-medium text-slate-900 dark:text-slate-100 break-words hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {recording.filename}
            </h3>
            <div className="flex flex-wrap gap-4">
              <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                📅 {formatDate(recording.timestamp)}
              </span>
              {recording.duration && (
                <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  ⏱️ {formatDuration(recording.duration)}
                </span>
              )}
              {recording.size && (
                <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  💾 {formatSize(recording.size)}
                </span>
              )}
              {recording.transcribing && (
                <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  🎤 Transcribing...
                </span>
              )}
              {recording.transcript && !recording.transcribing && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  ✓ Transcribed
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            rounded="full"
            className="bg-transparent px-3 py-2 text-lg flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onStartRename(recording);
            }}
            title="Rename video"
          >
            Rename
          </Button>
          {isJiraConnected && (
            recording.jiraIssueKey ? (
              <a
                href={recording.jiraIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-2 text-sm font-medium flex-shrink-0 bg-blue-600 dark:bg-blue-500 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2"
                title={`View Jira Issue ${recording.jiraIssueKey}`}
              >
                {recording.jiraIssueKey}
              </a>
            ) : onCreateJiraIssue ? (
              <Button
                variant="primary"
                rounded="full"
                className="px-3 py-2 text-sm flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateJiraIssue(recording);
                }}
                title="Create Jira Issue"
              >
                Create Jira Ticket
              </Button>
            ) : null
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <ContextMenu
              items={[
                // Conditionally add Unlink Jira Issue if linked
                ...(recording.jiraIssueKey && onUnlinkJiraIssue
                  ? [
                      {
                        label: "Unlink Jira Issue",
                        icon: "🔗",
                        onClick: () => onUnlinkJiraIssue(recording.id),
                        className:
                          "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20",
                      },
                    ]
                  : []),
                {
                  label: "Delete",
                  icon: "🗑️",
                  onClick: () => onDelete(recording.id),
                  className:
                    "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                },
              ]}
              triggerButton={
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                  <span className="text-lg">⋮</span>
                </button>
              }
            />
          </div>
        </>
      )}
    </div>
  );
};

export default RecordingCard;
