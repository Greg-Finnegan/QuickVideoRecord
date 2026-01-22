import React from "react";
import Button from "../../components/Button";
import ContextMenu from "../../components/ContextMenu";
import RecordingMetadata from "./RecordingMetadata";
import Icon from "../../components/Icon";
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
  onCopyTranscript?: (transcript: string) => void;
  onOpenInChatGPT?: (transcript: string) => void;
  onShowInFinder?: (downloadId: number) => void;
  onOpenFileLocally?: (recordingId: string, filename: string) => void;
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
  onCopyTranscript,
  onOpenInChatGPT,
  onShowInFinder,
  onOpenFileLocally,
  isJiraConnected,
  formatDate,
  formatSize,
  formatDuration,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full p-4 flex items-center gap-4 transition-all hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
      <div className="text-slate-600 dark:text-slate-400 flex-shrink-0">
        <Icon name="video" size={32} />
      </div>
      {renamingId === recording.id ? (
        // modal
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
        // list
        <>
          <RecordingMetadata
            recording={recording}
            onPlay={onPlay}
            formatDate={formatDate}
            formatSize={formatSize}
            formatDuration={formatDuration}
          />
          <Button
            variant="ghost"
            rounded="full"
            className="bg-transparent !px-2 !py-2 text-lg flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (recording.transcript && onCopyTranscript) {
                onCopyTranscript(recording.transcript);
              }
            }}
            disabled={!recording.transcript}
            title={
              recording.transcript
                ? "Copy transcript to clipboard"
                : "No transcript available"
            }
          >
            Copy Script
            <Icon name="copy" size={14} />
          </Button>
          <Button
            variant="ghost"
            rounded="full"
            className="bg-transparent !px-2 !py-2 text-lg flex-shrink-0 !gap-1"
            onClick={(e) => {
              e.stopPropagation();
              if (recording.transcript && onOpenInChatGPT) {
                onOpenInChatGPT(recording.transcript);
              }
            }}
            disabled={!recording.transcript}
            title={
              recording.transcript
                ? "Open in ChatGPT with transcript"
                : "No transcript available"
            }
          >
            Open in ChatGPT
            <Icon name="external-link" size={14} />
          </Button>
          {isJiraConnected &&
            (recording.jiraIssueKey ? (
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
            ) : null)}
          <div onClick={(e) => e.stopPropagation()}>
            <ContextMenu
              items={[
                // Add Rename as first item
                {
                  label: "Rename",
                  icon: <Icon name="edit" size={16} />,
                  onClick: () => onStartRename(recording),
                  className: "",
                },
                {
                  label: "Open Local File",
                  icon: <Icon name="folder" size={16} />,
                  onClick: () => onShowInFinder?.(recording.downloadId!),
                  className: "",
                },

                // Add Open file locally option (fallback)
                ...(onOpenFileLocally
                  ? [
                    {
                      label: "Download",
                      icon: <Icon name="folder" size={16} />,
                      onClick: () => onOpenFileLocally(recording.id, recording.filename),
                      className: "",
                    },
                  ]
                  : []),
                // Conditionally add Unlink Jira Issue if linked
                ...(recording.jiraIssueKey && onUnlinkJiraIssue
                  ? [
                    {
                      label: "Unlink Jira Issue",
                      icon: <Icon name="link" size={16} />,
                      onClick: () => onUnlinkJiraIssue(recording.id),
                      className:
                        "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20",
                    },
                  ]
                  : []),
                {
                  label: "Delete",
                  icon: <Icon name="trash" size={16} />,
                  onClick: () => onDelete(recording.id),
                  className:
                    "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default RecordingCard;
