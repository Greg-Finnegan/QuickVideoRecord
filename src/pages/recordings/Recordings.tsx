import React from "react";
import "../../index.css";
import VideoPlayerModal from "../../components/VideoPlayerModal";
import MainApplicationHeader from "../../components/MainApplicationHeader";
import RecordingCard from "./RecordingCard";
import EmptyRecordingsState from "./EmptyRecordingsState";
import Pagination from "./Pagination";
import ToastContainer from "../../components/ToastContainer";
import { useRecordings } from "./hooks/useRecordings";
import { useRecordingRename } from "./hooks/useRecordingRename";
import { useVideoPlayer } from "./hooks/useVideoPlayer";
import { useTranscription } from "./hooks/useTranscription";
import { useRecordingTranscriptionUpdates } from "./hooks/useRecordingTranscriptionUpdates";
import { useJiraIssueManagement } from "./hooks/useJiraIssueManagement";
import { usePagination } from "./hooks/usePagination";
import { useJiraConnection } from "../settings/hooks/useJiraConnection";
import { useJiraProjects } from "../settings/hooks/useJiraProjects";
import { useToast } from "../../hooks/useToast";
import { formatDate, formatSize, formatDuration } from "./utils/formatters";
import CreateJiraIssueModal from "@src/components/jira/CreateJiraIssueModal";

const Recordings: React.FC = () => {
  const { recordings, loading, setRecordings, deleteRecording } =
    useRecordings();

  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedRecordings,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = usePagination({
    items: recordings,
    itemsPerPage: 15,
  });

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

  // Jira integration
  const { isJiraConnected } = useJiraConnection();
  const { defaultProject } = useJiraProjects(isJiraConnected);
  const { toasts, removeToast, success } = useToast();

  const {
    showCreateIssueModal,
    selectedRecordingForJira,
    handleOpenCreateIssue,
    handleCloseCreateIssue,
    handleIssueCreated,
    handleUnlinkJiraIssue,
  } = useJiraIssueManagement({
    setRecordings,
    onSuccess: success,
  });

  const handleDeleteRecording = async (id: string) => {
    const confirmed = confirm(
      "Are you sure you want to delete this recording? This action cannot be undone."
    );
    if (!confirmed) return;

    await deleteRecording(id);
    if (selectedRecording?.id === id) {
      closePlayer();
    }
  };

  const handleCopyTranscript = async (transcript: string) => {
    try {
      await navigator.clipboard.writeText(transcript);
      success("Transcript copied to clipboard!");
    } catch (error) {
      console.error('Failed to copy transcript:', error);
    }
  };

  const handleOpenInChatGPT = async (transcript: string) => {
    const prompt = "short hand cliff notes and make name for this dev ticket - below is the transcript describing the bug/ticket";
    const fullMessage = `${prompt}\n\n${transcript}`;

    try {
      await navigator.clipboard.writeText(fullMessage);
      window.open('https://chatgpt.com/?q=' + fullMessage, '_blank');
      success("Prompt copied to clipboard! Paste it into ChatGPT.");
    } catch (error) {
      console.error('Failed to copy prompt or open ChatGPT:', error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <MainApplicationHeader
        title="Recording History"
        subtitle="View and manage your screen recordings"
      />

      <div className="px-10 py-6 max-w-[1200px] mx-auto">
        {loading ? (
          <div className="text-center py-20 px-5">
            <p>Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <EmptyRecordingsState />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {paginatedRecordings.map((recording) => (
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
                  onCreateJiraIssue={handleOpenCreateIssue}
                  onUnlinkJiraIssue={handleUnlinkJiraIssue}
                  onCopyTranscript={handleCopyTranscript}
                  onOpenInChatGPT={handleOpenInChatGPT}
                  isJiraConnected={isJiraConnected}
                  formatDate={formatDate}
                  formatSize={formatSize}
                  formatDuration={formatDuration}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={recordings.length}
              itemsPerPage={15}
              onPageChange={goToPage}
              onNextPage={goToNextPage}
              onPreviousPage={goToPreviousPage}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
            />
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

      {/* Create Jira Issue Modal */}
      {showCreateIssueModal && selectedRecordingForJira && (
        <CreateJiraIssueModal
          recording={selectedRecordingForJira}
          onClose={handleCloseCreateIssue}
          onSuccess={handleIssueCreated}
          defaultProjectKey={defaultProject}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default Recordings;
