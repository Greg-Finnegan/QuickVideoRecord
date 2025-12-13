import React, { useState, useEffect } from "react";
import Button from "../Button";
import Icon from "../Icon";
import JiraDropdown from "./JiraDropdown";
import { useJiraConnection } from "../../pages/settings/hooks/useJiraConnection";
import { useJiraProjects } from "../../pages/settings/hooks/useJiraProjects";
import { useJiraIssueTypes } from "../../pages/recordings/hooks/useJiraIssueTypes";
import { useJiraIssueCreation } from "../../pages/recordings/hooks/useJiraIssueCreation";
import type { Recording, CreateIssueFormData } from "../../types";

interface CreateJiraIssueModalProps {
  recording: Recording;
  onClose: () => void;
  onSuccess: (issueKey: string, issueUrl: string) => void;
  defaultProjectKey?: string;
}

const CreateJiraIssueModal: React.FC<CreateJiraIssueModalProps> = ({
  recording,
  onClose,
  onSuccess,
  defaultProjectKey,
}) => {
  const { isJiraConnected } = useJiraConnection();
  const { jiraProjects, loadingProjects } = useJiraProjects(isJiraConnected);

  // Form state
  const [projectKey, setProjectKey] = useState(defaultProjectKey || "");
  const [issueTypeName, setIssueTypeName] = useState("Task");
  const [summary, setSummary] = useState(recording.filename);
  const [description, setDescription] = useState(
    `Recording captured on ${new Date(recording.timestamp).toLocaleString()}${recording.transcript ? `\n\nTranscript:\n${recording.transcript}` : ""}`
  );
  const [priority, setPriority] = useState("");
  const [labelsInput, setLabelsInput] = useState("");
  const [attachVideo, setAttachVideo] = useState(true);

  // Hooks for business logic
  const { issueTypes, loading: loadingIssueTypes } = useJiraIssueTypes(projectKey);
  const { creating, error, createIssue, reset } = useJiraIssueCreation();

  // Update issue type when issue types load
  useEffect(() => {
    if (issueTypes.length > 0 && !issueTypeName) {
      // Default to "Task" if available, otherwise first type
      const taskType = issueTypes.find((type) => type.name === "Task");
      setIssueTypeName(taskType ? taskType.name! : issueTypes[0].name!);
    }
  }, [issueTypes, issueTypeName]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !creating) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, creating]);

  // Parse labels from comma-separated input
  const parseLabels = (input: string): string[] => {
    return input
      .split(",")
      .map((label) => label.trim())
      .filter((label) => label.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData: CreateIssueFormData = {
      recordingId: recording.id,
      projectKey,
      summary,
      description: description.trim() || undefined,
      issueTypeName,
      priority: priority || undefined,
      labels: parseLabels(labelsInput),
      attachVideo,
    };

    try {
      const result = await createIssue(formData);

      // Handle partial success (issue created but attachment failed)
      if (result.attachmentFailed) {
        onSuccess(result.issueKey, result.issueUrl);
        // Parent will show warning toast
      } else {
        onSuccess(result.issueKey, result.issueUrl);
      }
    } catch (err) {
      // Error is already set by the hook, just stay on modal
      console.error("Error creating issue:", err);
    }
  };

  // Project options for dropdown
  const projectOptions = jiraProjects.map((project) => ({
    value: project.key || "",
    label: project.name || "",
    description: project.key,
  }));

  // Issue type options for dropdown
  const issueTypeOptions = issueTypes.map((type) => ({
    value: type.name || "",
    label: type.name || "",
    description: type.description,
  }));

  // Priority options
  const priorityOptions = [
    { value: "", label: "None", description: "No priority" },
    { value: "Highest", label: "Highest", description: "Highest priority" },
    { value: "High", label: "High", description: "High priority" },
    { value: "Medium", label: "Medium", description: "Medium priority" },
    { value: "Low", label: "Low", description: "Low priority" },
    { value: "Lowest", label: "Lowest", description: "Lowest priority" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Create Jira Issue
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
              {recording.filename}
            </p>
          </div>
          <Button
            variant="ghost"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            onClick={onClose}
            disabled={creating}
          >
            <Icon name="close" size={24} />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {/* Project Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Project <span className="text-red-500">*</span>
            </label>
            <JiraDropdown
              options={projectOptions}
              value={projectKey}
              onChange={setProjectKey}
              placeholder="Select a project"
              loading={loadingProjects}
              disabled={creating}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Select the Jira project for this issue
            </p>
          </div>

          {/* Issue Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Issue Type <span className="text-red-500">*</span>
            </label>
            <JiraDropdown
              options={issueTypeOptions}
              value={issueTypeName}
              onChange={setIssueTypeName}
              placeholder="Select issue type"
              loading={loadingIssueTypes}
              disabled={creating || !projectKey}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Type of issue (e.g., Bug, Task, Story)
            </p>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Summary <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of the issue"
              maxLength={255}
              disabled={creating}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              required
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {summary.length}/255 characters
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description (optional)"
              rows={4}
              disabled={creating}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y disabled:opacity-50"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Additional details about the issue
            </p>
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Priority
            </label>
            <JiraDropdown
              options={priorityOptions}
              value={priority}
              onChange={setPriority}
              placeholder="Select priority (optional)"
              disabled={creating}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Issue priority (optional)
            </p>
          </div>

          {/* Labels */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Labels
            </label>
            <input
              type="text"
              value={labelsInput}
              onChange={(e) => setLabelsInput(e.target.value)}
              placeholder="bug, enhancement, urgent"
              disabled={creating}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Comma-separated labels
            </p>
            {/* Show parsed labels as chips */}
            {labelsInput && (
              <div className="flex flex-wrap gap-2 mt-2">
                {parseLabels(labelsInput).map((label, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attach Video Checkbox */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={attachVideo}
                onChange={(e) => setAttachVideo(e.target.checked)}
                disabled={creating}
                className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Attach video recording to issue
              </span>
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 ml-6">
              Video will be uploaded as an attachment
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={creating || !projectKey || !summary.trim() || !issueTypeName}
            >
              {creating
                ? attachVideo
                  ? "Creating & Attaching..."
                  : "Creating..."
                : "Create Issue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJiraIssueModal;
