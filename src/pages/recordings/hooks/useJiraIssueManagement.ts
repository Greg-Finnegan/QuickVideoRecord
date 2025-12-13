import { useState } from "react";
import type { Recording } from "../../../types";

interface UseJiraIssueManagementProps {
  setRecordings: React.Dispatch<React.SetStateAction<Recording[]>>;
  onSuccess: (message: string, link?: { text: string; url: string }) => void;
}

/**
 * Hook for managing Jira issue operations on recordings
 * Handles creating and unlinking Jira issues from recordings
 */
export const useJiraIssueManagement = ({
  setRecordings,
  onSuccess,
}: UseJiraIssueManagementProps) => {
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [selectedRecordingForJira, setSelectedRecordingForJira] =
    useState<Recording | null>(null);

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

    onSuccess(`Jira issue ${issueKey} created successfully!`, {
      text: "Open in Jira",
      url: issueUrl,
    });
    handleCloseCreateIssue();
  };

  const handleUnlinkJiraIssue = async (recordingId: string) => {
    // Confirm before unlinking
    const confirmed = confirm(
      "Are you sure you want to unlink this Jira issue? This won't delete the issue in Jira."
    );
    if (!confirmed) return;

    try {
      // Get recordings from storage
      const result = await chrome.storage.local.get("recordings");
      const recordings = (result.recordings as Recording[]) || [];

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

      onSuccess("Jira issue unlinked successfully");
    } catch (error) {
      console.error("Failed to unlink Jira issue:", error);
    }
  };

  return {
    showCreateIssueModal,
    selectedRecordingForJira,
    handleOpenCreateIssue,
    handleCloseCreateIssue,
    handleIssueCreated,
    handleUnlinkJiraIssue,
  };
};
