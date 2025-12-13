import React, { useState, useEffect } from "react";
import "../../index.css";
import Button from "../../components/Button";
import CopyButton from "../../components/CopyButton";
import JiraConnect from "../../components/JiraConnect";
import ContextMenu from "../../components/ContextMenu";
import { Recording, RecordingStorage } from "../../types/recording";
import { videoStorage } from "../../utils/videoStorage";
import { transcriptionService } from "../../utils/transcription";

const Recordings: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] =
    useState<string>("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState<string>("");

  useEffect(() => {
    loadRecordings();

    // Listen for transcription updates
    const messageListener = (message: any) => {
      if (message.action === 'transcriptionStarted') {
        // Update the recording to show it's transcribing
        setRecordings((prevRecordings) =>
          prevRecordings.map((r) =>
            r.id === message.recordingId ? { ...r, transcribing: true } : r
          )
        );
      } else if (message.action === 'transcriptionComplete') {
        // Update the recording with the transcript
        setRecordings((prevRecordings) =>
          prevRecordings.map((r) =>
            r.id === message.recordingId
              ? { ...r, transcript: message.transcript, transcribing: false }
              : r
          )
        );
        // Update selected recording if it's the one being transcribed
        if (selectedRecording?.id === message.recordingId) {
          setSelectedRecording({
            ...selectedRecording,
            transcript: message.transcript,
            transcribing: false,
          });
        }
      } else if (message.action === 'transcriptionFailed') {
        // Update the recording to show transcription failed
        setRecordings((prevRecordings) =>
          prevRecordings.map((r) =>
            r.id === message.recordingId ? { ...r, transcribing: false } : r
          )
        );
      }
    };

    // Listen for storage changes (for when recordings are updated)
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.recordings) {
        const newRecordings = changes.recordings.newValue as Recording[];
        if (newRecordings) {
          setRecordings(newRecordings);
          // Update selected recording if it changed
          if (selectedRecording) {
            const updatedSelected = newRecordings.find(
              (r) => r.id === selectedRecording.id
            );
            if (updatedSelected) {
              setSelectedRecording(updatedSelected);
            }
          }
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, [selectedRecording]);

  const loadRecordings = async () => {
    try {
      const result = (await chrome.storage.local.get(
        "recordings"
      )) as RecordingStorage;
      const savedRecordings: Recording[] = result.recordings || [];
      setRecordings(savedRecordings);
    } catch (error) {
      console.error("Failed to load recordings:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = async (id: string) => {
    const updatedRecordings = recordings.filter((r) => r.id !== id);
    await chrome.storage.local.set({ recordings: updatedRecordings });
    await videoStorage.deleteVideo(id);
    setRecordings(updatedRecordings);

    // Close player if deleted recording was being played
    if (selectedRecording?.id === id) {
      closePlayer();
    }
  };

  const clearAllRecordings = async () => {
    if (
      window.confirm("Are you sure you want to clear all recording history?")
    ) {
      await chrome.storage.local.set({ recordings: [] });
      await videoStorage.clearAll();
      setRecordings([]);
      closePlayer();
    }
  };

  const playRecording = async (recording: Recording) => {
    try {
      const blob = await videoStorage.getVideo(recording.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setSelectedRecording(recording);
      } else {
        alert(
          "Video not found. It may have been deleted or not saved properly."
        );
      }
    } catch (error) {
      console.error("Failed to load video:", error);
      alert("Failed to load video");
    }
  };

  const closePlayer = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setSelectedRecording(null);
    setTranscribing(false);
    setTranscriptionProgress("");
  };

  const transcribeRecording = async (recording: Recording) => {
    if (!recording.id) return;

    setTranscribing(true);
    setTranscriptionProgress("Starting transcription...");

    try {
      const blob = await videoStorage.getVideo(recording.id);
      if (!blob) {
        alert("Video not found");
        return;
      }

      const transcript = await transcriptionService.transcribeVideo(
        blob,
        (status, progress) => {
          setTranscriptionProgress(`${status} (${progress}%)`);
        }
      );

      // Update recording with transcript
      const result = (await chrome.storage.local.get(
        "recordings"
      )) as RecordingStorage;
      const allRecordings: Recording[] = result.recordings || [];
      const updatedRecordings = allRecordings.map((r) =>
        r.id === recording.id ? { ...r, transcript } : r
      );

      await chrome.storage.local.set({ recordings: updatedRecordings });
      setRecordings(updatedRecordings);

      // Update selected recording
      if (selectedRecording?.id === recording.id) {
        setSelectedRecording({ ...selectedRecording, transcript });
      }

      setTranscriptionProgress("Transcription complete!");
      setTimeout(() => setTranscriptionProgress(""), 3000);
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Transcription failed. Please try again.");
      setTranscriptionProgress("");
    } finally {
      setTranscribing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renameRecording = async (id: string) => {
    if (!newFilename.trim()) {
      alert("Please enter a valid filename");
      return;
    }

    const result = (await chrome.storage.local.get(
      "recordings"
    )) as RecordingStorage;
    const allRecordings: Recording[] = result.recordings || [];
    const updatedRecordings = allRecordings.map((r) =>
      r.id === id ? { ...r, filename: newFilename.trim() } : r
    );

    await chrome.storage.local.set({ recordings: updatedRecordings });
    setRecordings(updatedRecordings);

    // Update selected recording if it's the one being renamed
    if (selectedRecording?.id === id) {
      setSelectedRecording({
        ...selectedRecording,
        filename: newFilename.trim(),
      });
    }

    setRenamingId(null);
    setNewFilename("");
  };

  const startRename = (recording: Recording) => {
    setRenamingId(recording.id);
    setNewFilename(recording.filename);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setNewFilename("");
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <div className="bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-10 py-8">
        <div className="flex justify-between items-center max-w-[1250px] mx-auto">
          <div className="flex flex-col">
            <h1 className="m-0 text-2xl font-medium text-slate-900 dark:text-slate-100">
              Recording History
            </h1>
            <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
              View and manage your screen recordings
            </p>
          </div>
          <div className="mt-2">
            <JiraConnect />
          </div>
        </div>
      </div>

      <div className="px-10 py-6 max-w-[1200px] mx-auto">
        {loading ? (
          <div className="text-center py-20 px-5">
            <p>Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-20 px-5">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="m-0 mb-2 text-xl font-medium text-slate-900 dark:text-slate-100">
              No recordings yet
            </h2>
            <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
              Your recording history will appear here after you create your
              first recording.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button
                variant="secondary"
                rounded="full"
                onClick={clearAllRecordings}
              >
                Clear All History
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-4 flex items-center gap-4 transition-all hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                >
                  <div className="text-[32px] flex-shrink-0">🎥</div>
                  {renamingId === recording.id ? (
                    <>
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <input
                          type="text"
                          value={newFilename}
                          onChange={(e) => setNewFilename(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameRecording(recording.id);
                            } else if (e.key === "Escape") {
                              cancelRename();
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
                          renameRecording(recording.id);
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
                          cancelRename();
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
                        onClick={() => playRecording(recording)}
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
                        className="bg-transparent px-3 py-2 text-lg hover:text-white flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(recording);
                        }}
                        title="Rename video"
                      >
                        Rename
                      </Button>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ContextMenu
                          items={[
                            {
                              label: "Delete",
                              icon: "🗑️",
                              onClick: () => deleteRecording(recording.id),
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
              ))}
            </div>
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedRecording && videoUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={closePlayer}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 truncate flex-1">
                {selectedRecording.filename}
              </h2>
              {!selectedRecording.transcript && !transcribing && (
                <Button
                  variant="primary"
                  rounded="full"
                  className="mr-2 px-4 py-2 text-sm"
                  onClick={() => transcribeRecording(selectedRecording)}
                >
                  🎤 Transcribe
                </Button>
              )}
              <Button
                variant="ghost"
                className="text-2xl p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                onClick={closePlayer}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <video
                src={videoUrl}
                controls
                autoPlay
                className="w-full rounded mb-4"
                style={{ maxHeight: "calc(60vh - 120px)" }}
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

              {selectedRecording.transcript && (
                <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded p-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    📝 Transcript
                    <CopyButton textToCopy={selectedRecording.transcript} />
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {selectedRecording.transcript}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recordings;
