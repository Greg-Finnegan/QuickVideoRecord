import React from "react";
import "../../index.css";
import Button from "../../components/Button";
import JiraConnect from "../../components/JiraConnect";
import VideoPlayerModal from "../../components/VideoPlayerModal";
import RecordingCard from "./RecordingCard";
import { useRecordings } from "./hooks/useRecordings";
import { useRecordingRename } from "./hooks/useRecordingRename";
import { useVideoPlayer } from "./hooks/useVideoPlayer";
import { useTranscription } from "./hooks/useTranscription";
import { useRecordingTranscriptionUpdates } from "./hooks/useRecordingTranscriptionUpdates";
import { formatDate, formatSize, formatDuration } from "./utils/formatters";

const Recordings: React.FC = () => {
  const {
    recordings,
    loading,
    setRecordings,
    deleteRecording,
    clearAllRecordings,
  } = useRecordings();

  const {
    renamingId,
    newFilename,
    setNewFilename,
    startRename,
    cancelRename,
    renameRecording,
  } = useRecordingRename();

  const {
    selectedRecording,
    videoUrl,
    playRecording,
    closePlayer,
    updateSelectedRecording,
  } = useVideoPlayer();

  const { transcribing, transcriptionProgress, transcribeRecording } =
    useTranscription({
      selectedRecording,
      onRecordingUpdate: updateSelectedRecording,
    });

  useRecordingTranscriptionUpdates({ setRecordings });

  const handleDeleteRecording = async (id: string) => {
    await deleteRecording(id);
    if (selectedRecording?.id === id) {
      closePlayer();
    }
  };

  const handleClearAll = async () => {
    const cleared = await clearAllRecordings();
    if (cleared) {
      closePlayer();
    }
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
                onClick={handleClearAll}
              >
                Clear All History
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {recordings.map((recording) => (
                <RecordingCard
                  key={recording.id}
                  recording={recording}
                  renamingId={renamingId}
                  newFilename={newFilename}
                  onFilenameChange={setNewFilename}
                  onRename={renameRecording}
                  onCancelRename={cancelRename}
                  onStartRename={startRename}
                  onPlay={playRecording}
                  onDelete={handleDeleteRecording}
                  formatDate={formatDate}
                  formatSize={formatSize}
                  formatDuration={formatDuration}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedRecording && videoUrl && (
        <VideoPlayerModal
          recording={selectedRecording}
          videoUrl={videoUrl}
          transcribing={transcribing}
          transcriptionProgress={transcriptionProgress}
          onClose={closePlayer}
          onTranscribe={transcribeRecording}
          onUpdateRecording={(updatedRecording) => {
            updateSelectedRecording(updatedRecording);
            setRecordings((prevRecordings) =>
              prevRecordings.map((r) =>
                r.id === updatedRecording.id ? updatedRecording : r
              )
            );
          }}
        />
      )}
    </div>
  );
};

export default Recordings;
