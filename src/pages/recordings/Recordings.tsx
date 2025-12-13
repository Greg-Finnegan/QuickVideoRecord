import React, { useState } from "react";
import "../../index.css";
import Button from "../../components/Button";
import VideoPlayerModal from "../../components/VideoPlayerModal";
import MainApplicationHeader from "../../components/MainApplicationHeader";
import RecordingCard from "./RecordingCard";
import CreateJiraIssueModal from "../../components/CreateJiraIssueModal";
import ToastContainer from "../../components/ToastContainer";
import { useRecordings } from "./hooks/useRecordings";
import { useRecordingRename } from "./hooks/useRecordingRename";
import { useVideoPlayer } from "./hooks/useVideoPlayer";
import { useTranscription } from "./hooks/useTranscription";
import { useRecordingTranscriptionUpdates } from "./hooks/useRecordingTranscriptionUpdates";
import { useJiraConnection } from "../settings/hooks/useJiraConnection";
import { useJiraProjects } from "../settings/hooks/useJiraProjects";
import { useToast } from "../../hooks/useToast";
import { formatDate, formatSize, formatDuration } from "./utils/formatters";
import type { Recording } from "../../types";

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

  // Jira integration
  const { isJiraConnected } = useJiraConnection();
  const { defaultProject } = useJiraProjects(isJiraConnected);
  const { toasts, removeToast, success, warning } = useToast();

  // Jira issue creation modal state
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [selectedRecordingForJira, setSelectedRecordingForJira] = useState<Recording | null>(null);

  const handleDeleteRecording = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this recording? This action cannot be undone.");
    if (!confirmed) return;

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

  const handleOpenCreateIssue = (recording: Recording) => {
    setSelectedRecordingForJira(recording);
    setShowCreateIssueModal(true);
  };

  const handleCloseCreateIssue = () => {
    setShowCreateIssueModal(false);
    setSelectedRecordingForJira(null);
  };

  const handleIssueCreated = (issueKey: string, issueUrl: string) => {
    // Update the recording in local state with the Jira issue information
    if (selectedRecordingForJira) {
      setRecordings((prevRecordings) =>
        prevRecordings.map((r) =>
          r.id === selectedRecordingForJira.id
            ? { ...r, jiraIssueKey: issueKey, jiraIssueUrl: issueUrl }
            : r
        )
      );
    }

    success(`Jira issue ${issueKey} created successfully!`, {
      text: "Open in Jira",
      url: issueUrl,
    });
    handleCloseCreateIssue();
  };

  const handleUnlinkJiraIssue = async (recordingId: string) => {
    // Confirm before unlinking
    const confirmed = confirm("Are you sure you want to unlink this Jira issue? This won't delete the issue in Jira.");
    if (!confirmed) return;

    try {
      // Get recordings from storage
      const result = await chrome.storage.local.get("recordings");
      const recordings = result.recordings || [];

      // Find and update the recording
      const updatedRecordings = recordings.map((r: Recording) =>
        r.id === recordingId
          ? {
              ...r,
              jiraIssueKey: undefined,
              jiraIssueUrl: undefined,
            }
          : r
      );

      // Save back to storage
      await chrome.storage.local.set({ recordings: updatedRecordings });

      // Update local state
      setRecordings((prevRecordings) =>
        prevRecordings.map((r) =>
          r.id === recordingId
            ? { ...r, jiraIssueKey: undefined, jiraIssueUrl: undefined }
            : r
        )
      );

      success("Jira issue unlinked successfully");
    } catch (error) {
      console.error("Failed to unlink Jira issue:", error);
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
                  onCreateJiraIssue={handleOpenCreateIssue}
                  onUnlinkJiraIssue={handleUnlinkJiraIssue}
                  isJiraConnected={isJiraConnected}
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
