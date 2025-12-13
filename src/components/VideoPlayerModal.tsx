import React, { useState, useEffect } from "react";
import Button from "./Button";
import CopyButton from "./CopyButton";
import EditableFilename from "./EditableFilename";
import { Recording, RecordingStorage } from "../types/recording";

interface VideoPlayerModalProps {
  recording: Recording;
  videoUrl: string;
  transcribing: boolean;
  transcriptionProgress: string;
  onClose: () => void;
  onTranscribe: (recording: Recording) => void;
  onUpdateRecording: (updatedRecording: Recording) => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  recording,
  videoUrl,
  transcribing,
  transcriptionProgress,
  onClose,
  onTranscribe,
  onUpdateRecording,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Don't close modal if user is editing an input field
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleFilenameSave = async (newFilename: string) => {
    const result = (await chrome.storage.local.get(
      "recordings"
    )) as RecordingStorage;
    const allRecordings: Recording[] = result.recordings || [];
    const updatedRecordings = allRecordings.map((r) =>
      r.id === recording.id ? { ...r, filename: newFilename } : r
    );

    await chrome.storage.local.set({
      recordings: updatedRecordings,
    });

    onUpdateRecording({
      ...recording,
      filename: newFilename,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <EditableFilename
              filename={recording.filename}
              variant="large"
              onSave={handleFilenameSave}
            />
          </div>
          {!recording.transcript && !transcribing && (
            <Button
              variant="primary"
              rounded="full"
              className="mr-2 px-4 py-2 text-sm"
              onClick={() => onTranscribe(recording)}
            >
              🎤 Transcribe
            </Button>
          )}
          {recording.transcript && (
            <div className="mr-2 flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Copy Transcript
              </span>
              <CopyButton textToCopy={recording.transcript} />
            </div>
          )}
          <Button
            variant="ghost"
            className="text-2xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <video
            src={videoUrl}
            controls
            className="w-full rounded mb-4"
            style={{ maxHeight: "500px" }}
          />

          {transcribing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin text-2xl">⚙️</div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    Transcribing...
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {transcriptionProgress}
                  </div>
                </div>
              </div>
            </div>
          )}

          {recording.transcript && (
            <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded mb-4">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors rounded"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  📝 Transcript
                </h3>
                <span className="text-lg text-slate-600 dark:text-slate-400">
                  {showTranscript ? "▼" : "▶"}
                </span>
              </button>
              {showTranscript && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-end mb-2">
                    <CopyButton textToCopy={recording.transcript} />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {recording.transcript}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Raw Data Section for Dev */}
          <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors rounded"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                🔧 Raw Data (Dev)
              </h3>
              <span className="text-lg text-slate-600 dark:text-slate-400">
                {showRawData ? "▼" : "▶"}
              </span>
            </button>
            {showRawData && (
              <div className="px-4 pb-4">
                <div className="bg-slate-900 dark:bg-black rounded p-3 overflow-auto max-h-96">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(recording, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
