import React, { useState, useEffect } from "react";
import Button from "./Button";
import EditableFilename from "./EditableFilename";
import Icon from "./Icon";
import { useDevMode } from "../hooks/useDevMode";
import { Recording, RecordingStorage } from "../types/recording";

interface VideoPlayerModalProps {
  recording: Recording;
  videoUrl: string;
  transcribing: boolean;
  transcriptionProgress: string;
  onClose: () => void;
  onTranscribe: (recording: Recording) => void;
  onUpdateRecording: (updatedRecording: Recording) => void;
  onCopyTranscript?: (transcript: string) => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  recording,
  videoUrl,
  transcribing,
  transcriptionProgress,
  onClose,
  onTranscribe,
  onUpdateRecording,
  onCopyTranscript,
}) => {
  const { devMode } = useDevMode();
  const [showTranscript, setShowTranscript] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [editingRawData, setEditingRawData] = useState(false);
  const [rawDataDraft, setRawDataDraft] = useState("");
  const [rawDataError, setRawDataError] = useState("");

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

  const handleEditRawData = () => {
    setRawDataDraft(JSON.stringify(recording, null, 2));
    setRawDataError("");
    setEditingRawData(true);
  };

  const handleCancelEdit = () => {
    setEditingRawData(false);
    setRawDataError("");
  };

  const handleSaveRawData = async () => {
    try {
      const parsed = JSON.parse(rawDataDraft) as Recording;

      // Ensure the id hasn't changed
      if (parsed.id !== recording.id) {
        setRawDataError("Cannot change recording id");
        return;
      }

      // Update in chrome storage
      const result = (await chrome.storage.local.get(
        "recordings"
      )) as RecordingStorage;
      const allRecordings: Recording[] = result.recordings || [];
      const updatedRecordings = allRecordings.map((r) =>
        r.id === recording.id ? parsed : r
      );

      await chrome.storage.local.set({ recordings: updatedRecordings });
      onUpdateRecording(parsed);
      setEditingRawData(false);
      setRawDataError("");
    } catch (e: any) {
      setRawDataError(e.message || "Invalid JSON");
    }
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
              className="mr-2 px-4 py-2 text-sm flex items-center gap-2"
              onClick={() => onTranscribe(recording)}
            >
              <Icon name="mic" size={16} /> Transcribe
            </Button>
          )}
          {recording.transcript && (
            <Button
              variant="ghost"
              rounded="full"
              className="bg-transparent !px-2 !py-2 text-lg flex-shrink-0 mr-2"
              onClick={() => recording.transcript && onCopyTranscript?.(recording.transcript)}
            >
              Copy Script
              <Icon name="copy" size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            onClick={onClose}
            rounded="full"
          >
            <Icon name="close" size={24} />
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
                <div className="animate-spin text-blue-600 dark:text-blue-400">
                  <Icon name="settings" size={24} />
                </div>
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
                  <Icon name="file-text" size={16} /> Transcript
                </h3>
                <span className={`text-slate-600 dark:text-slate-400 inline-flex transition-transform ${showTranscript ? "rotate-90" : ""}`}>
                  <Icon name="chevron-right" size={18} />
                </span>
              </button>
              {showTranscript && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-end mb-2">
                    <Button
                      variant="ghost"
                      rounded="full"
                      className="bg-transparent !px-2 !py-2 text-sm flex-shrink-0"
                      onClick={() => recording.transcript && onCopyTranscript?.(recording.transcript)}
                    >
                      Copy Script
                      <Icon name="copy" size={14} />
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {recording.transcript}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Raw Data Section for Dev */}
          {devMode && <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors rounded"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Icon name="wrench" size={16} /> Raw Data (Dev)
              </h3>
              <span className={`text-slate-600 dark:text-slate-400 inline-flex transition-transform ${showRawData ? "rotate-90" : ""}`}>
                <Icon name="chevron-right" size={18} />
              </span>
            </button>
            {showRawData && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-end mb-2 gap-2">
                  {editingRawData ? (
                    <>
                      <Button
                        variant="ghost"
                        className="px-3 py-1 text-xs"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="px-3 py-1 text-xs"
                        onClick={handleSaveRawData}
                      >
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      className="px-3 py-1 text-xs"
                      onClick={handleEditRawData}
                    >
                      <Icon name="edit" size={14} />
                      <span className="ml-1">Edit</span>
                    </Button>
                  )}
                </div>
                {rawDataError && (
                  <div className="text-xs text-red-400 bg-red-900/30 border border-red-700 rounded px-3 py-2 mb-2 font-mono">
                    {rawDataError}
                  </div>
                )}
                {editingRawData ? (
                  <textarea
                    value={rawDataDraft}
                    onChange={(e) => setRawDataDraft(e.target.value)}
                    spellCheck={false}
                    className="w-full bg-slate-900 dark:bg-black rounded p-3 text-xs text-green-400 font-mono resize-y min-h-48 max-h-96 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
                    rows={20}
                  />
                ) : (
                  <div className="bg-slate-900 dark:bg-black rounded p-3 overflow-auto max-h-96">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(recording, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;
