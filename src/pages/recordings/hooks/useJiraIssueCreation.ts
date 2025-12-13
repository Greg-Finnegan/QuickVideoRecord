import { useState } from "react";
import { jiraService } from "../../../utils/jiraService";
import { jiraAuth } from "../../../utils/jiraAuth";
import { videoStorage } from "../../../utils/videoStorage";
import type { CreateIssueFormData, CreateIssueResult } from "../../../types";

/**
 * Hook for creating Jira issues from recordings
 * Handles issue creation, video attachment, and error states
 */
export const useJiraIssueCreation = () => {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate form data before submission
   */
  const validateFormData = (formData: CreateIssueFormData): string | null => {
    if (!formData.projectKey) {
      return "Please select a project";
    }
    if (!formData.summary || formData.summary.trim().length === 0) {
      return "Please enter a summary";
    }
    if (formData.summary.trim().length < 3) {
      return "Summary must be at least 3 characters";
    }
    if (!formData.issueTypeName) {
      return "Please select an issue type";
    }
    return null;
  };

  /**
   * Get the Jira site URL for constructing issue links
   */
  const getSiteUrl = async (): Promise<string | null> => {
    try {
      const tokens = await jiraAuth.getTokens();
      if (tokens?.siteName) {
        // Convert site name to URL format (e.g., "My Site" -> "my-site")
        const siteSlug = tokens.siteName.toLowerCase().replace(/\s+/g, "-");
        return `https://${siteSlug}.atlassian.net`;
      }
      // Fallback: try to get from cloudId or return null
      return null;
    } catch (err) {
      console.error("Failed to get site URL:", err);
      return null;
    }
  };

  /**
   * Create a Jira issue from form data
   * Optionally attaches the recording video
   */
  const createIssue = async (
    formData: CreateIssueFormData
  ): Promise<CreateIssueResult> => {
    // Validate form data
    const validationError = validateFormData(formData);
    if (validationError) {
      setError(validationError);
      throw new Error(validationError);
    }

    setCreating(true);
    setError(null);

    try {
      // Parse labels (comma-separated string to array)
      const labels = formData.labels
        ?.filter((label) => label && label.trim().length > 0)
        .map((label) => label.trim());

      // Create the issue
      const issue = await jiraService.createIssue({
        projectKey: formData.projectKey,
        summary: formData.summary.trim(),
        description: formData.description,
        issueTypeName: formData.issueTypeName,
        priority: formData.priority,
        labels,
      });

      // Construct issue URL
      const siteUrl = await getSiteUrl();
      const issueUrl = siteUrl
        ? `${siteUrl}/browse/${issue.key}`
        : `https://atlassian.net/browse/${issue.key}`; // Fallback

      let attachmentFailed = false;

      // Attach video if requested
      if (formData.attachVideo) {
        try {
          const videoBlob = await videoStorage.getVideo(formData.recordingId);

          if (videoBlob) {
            // Get the recording to extract the filename
            const result = await chrome.storage.local.get("recordings");
            const recordings = result.recordings || [];
            const recording = recordings.find(
              (r: { id: string; filename: string }) =>
                r.id === formData.recordingId
            );
            const filename = recording?.filename || "recording.webm";

            await jiraService.addAttachment(issue.key, videoBlob, filename);
          } else {
            console.warn("Video blob not found for recording:", formData.recordingId);
            attachmentFailed = true;
          }
        } catch (attachErr) {
          console.error("Failed to attach video:", attachErr);
          attachmentFailed = true;
        }
      }

      setCreating(false);
      return {
        issueKey: issue.key,
        issueUrl,
        attachmentFailed,
      };
    } catch (err) {
      console.error("Failed to create Jira issue:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create Jira issue. Please try again.";
      setError(errorMessage);
      setCreating(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Reset error state
   */
  const reset = () => {
    setError(null);
    setCreating(false);
  };

  return {
    creating,
    error,
    createIssue,
    reset,
  };
};
