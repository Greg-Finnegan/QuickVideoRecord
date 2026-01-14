import React, { useState, useEffect } from "react";
import Button from "../Button";
import Icon from "../Icon";
import JiraDropdown from "./JiraDropdown";
import { useJiraConnection } from "../../pages/settings/hooks/useJiraConnection";
import { useGeminiConnection } from "../../pages/settings/hooks/useGeminiConnection";
import { useJiraProjects } from "../../pages/settings/hooks/useJiraProjects";
import { useJiraIssueTypes } from "../../pages/recordings/hooks/useJiraIssueTypes";
import { useJiraIssueCreation } from "../../pages/recordings/hooks/useJiraIssueCreation";
import { useGeminiGeneration } from "../../pages/recordings/hooks/useGeminiGeneration";
import { jiraService } from "../../utils/jiraService";
import type { Recording, CreateIssueFormData, JiraSprint } from "../../types";
import type { Version3Models } from "jira.js";

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
    `Recording captured on ${new Date(recording.timestamp).toLocaleString()}${
      recording.transcript ? `\n\nTranscript:\n${recording.transcript}` : ""
    }`
  );
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [labelsInput, setLabelsInput] = useState("");
  const [attachVideo, setAttachVideo] = useState(true);

  // Additional data state
  const [priorities, setPriorities] = useState<Version3Models.Priority[]>([]);
  const [users, setUsers] = useState<Version3Models.User[]>([]);
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [defaultSprintObject, setDefaultSprintObject] = useState<JiraSprint | null>(null);
  const [loadingPriorities, setLoadingPriorities] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [sprintsLoaded, setSprintsLoaded] = useState(false);

  // Hooks for business logic
  const { issueTypes, loading: loadingIssueTypes } =
    useJiraIssueTypes(projectKey);
  const { creating, error, createIssue } = useJiraIssueCreation();
  const { isGeminiConnected } = useGeminiConnection();
  const { generating, generateDescription } = useGeminiGeneration();

  // Update issue type when issue types load
  useEffect(() => {
    if (issueTypes.length > 0 && !issueTypeName) {
      // Default to "Task" if available, otherwise first type
      const taskType = issueTypes.find((type) => type.name === "Task");
      setIssueTypeName(taskType ? taskType.name! : issueTypes[0].name!);
    }
  }, [issueTypes, issueTypeName]);

  // Load defaults from storage on mount
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const result = await chrome.storage.local.get([
          "defaultJiraPriority",
          "defaultJiraAssignee",
          "defaultJiraSprint",
        ]);
        if (
          result.defaultJiraPriority &&
          typeof result.defaultJiraPriority === "string"
        ) {
          setPriority(result.defaultJiraPriority);
        }
        if (
          result.defaultJiraAssignee &&
          typeof result.defaultJiraAssignee === "string"
        ) {
          setAssigneeId(result.defaultJiraAssignee);
        }
        // Handle JiraSprint object from storage
        if (
          result.defaultJiraSprint &&
          typeof result.defaultJiraSprint === "object" &&
          "id" in result.defaultJiraSprint &&
          result.defaultJiraSprint.id != null
        ) {
          const sprintObj = result.defaultJiraSprint as JiraSprint;
          setDefaultSprintObject(sprintObj);
          setSprintId(sprintObj.id.toString());
        }
      } catch (error) {
        console.error("Failed to load defaults:", error);
      }
    };

    loadDefaults();
  }, []);

  // Load priorities when modal opens
  useEffect(() => {
    const loadPriorities = async () => {
      if (!isJiraConnected) return;

      setLoadingPriorities(true);
      try {
        const fetchedPriorities = await jiraService.getPriorities();
        setPriorities(fetchedPriorities);
      } catch (error) {
        console.error("Failed to load priorities:", error);
      } finally {
        setLoadingPriorities(false);
      }
    };

    loadPriorities();
  }, [isJiraConnected]);

  // Load users when project changes
  useEffect(() => {
    const loadUsers = async () => {
      if (!isJiraConnected || !projectKey) {
        setUsers([]);
        return;
      }

      setLoadingUsers(true);
      try {
        const fetchedUsers = await jiraService.getProjectUsers(projectKey);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to load users:", error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [isJiraConnected, projectKey]);

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

  // Load sprints (only called when dropdown is opened)
  const loadSprints = async () => {
    if (sprintsLoaded || !isJiraConnected) return;

    setLoadingSprints(true);
    try {
      // Query for issues that have sprint data (customfield_10020)
      const issues = await jiraService.searchIssues(
        "created >= -365d AND customfield_10020 IS NOT EMPTY ORDER BY created DESC",
        100
      );

      // Extract unique sprints from issues
      const sprintMap = new Map<number, JiraSprint>();

      issues.forEach((issue) => {
        const sprintField = issue.fields?.customfield_10020;
        if (Array.isArray(sprintField)) {
          sprintField.forEach((sprint: any) => {
            if (sprint && sprint.id && !sprintMap.has(sprint.id)) {
              sprintMap.set(sprint.id, {
                id: sprint.id,
                name: sprint.name || "Unnamed Sprint",
                state: sprint.state || "future",
                boardId: sprint.boardId || 0,
                goal: sprint.goal || "",
              });
            }
          });
        }
      });

      // Convert to array and sort by state (active first, then future, then closed)
      const sprintArray = Array.from(sprintMap.values()).sort((a, b) => {
        const stateOrder = { active: 0, future: 1, closed: 2 };
        const stateCompare =
          stateOrder[a.state as keyof typeof stateOrder] -
          stateOrder[b.state as keyof typeof stateOrder];
        if (stateCompare !== 0) return stateCompare;
        return b.id - a.id; // Sort by ID descending within same state
      });

      setSprints(sprintArray);
      setSprintsLoaded(true);
    } catch (error) {
      console.error("Failed to load sprints:", error);
      setSprints([]);
    } finally {
      setLoadingSprints(false);
    }
  };

  // Parse labels from comma-separated input
  const parseLabels = (input: string): string[] => {
    return input
      .split(",")
      .map((label) => label.trim())
      .filter((label) => label.length > 0);
  };

  // Handle AI generation with Gemini
  const handleGenerateWithAI = async () => {
    if (!isGeminiConnected) {
      alert("Please connect to Gemini in Settings to use AI generation.");
      return;
    }

    if (!recording.transcript) {
      alert("Transcript is required for AI generation. Please transcribe the recording first.");
      return;
    }

    try {
      const generatedDesc = await generateDescription({
        recordingTitle: recording.filename,
        transcript: recording.transcript,
        additionalContext: summary,
      });

      setDescription(generatedDesc);
    } catch (err) {
      // Error already handled by hook
      alert("Failed to generate description. Please try again.");
    }
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
      assigneeId: assigneeId || undefined,
      sprintId: sprintId || undefined,
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

  // Priority options from Jira API
  const priorityOptions = [
    { value: "", label: "None", description: "No priority" },
    ...priorities.map((priority) => ({
      value: priority.id || "",
      label: priority.name || "",
      description: priority.description || "",
    })),
  ];

  // Assignee options from Jira API
  const assigneeOptions = [
    { value: "", label: "Unassigned", description: "No assignee" },
    ...users.map((user) => ({
      value: user.accountId || "",
      label: user.displayName || "Unknown User",
      description: user.emailAddress || "",
    })),
  ];

  // Sprint options from Jira API
  const getSprintStateLabel = (state: string) => {
    switch (state) {
      case "active":
        return "🟢";
      case "future":
        return "🔵";
      case "closed":
        return "⚪";
      default:
        return "";
    }
  };

  // Build sprint options - include default sprint if loaded, even if sprints list is empty
  const sprintOptions = [
    { value: "", label: "No Sprint", description: "Not assigned to a sprint" },
    // Add default sprint first if it exists and is not in the sprints list
    ...(defaultSprintObject &&
    defaultSprintObject.id != null &&
    !sprints.some((s) => s.id === defaultSprintObject.id)
      ? [
          {
            value: defaultSprintObject.id.toString(),
            label: `${getSprintStateLabel(defaultSprintObject.state)} ${defaultSprintObject.name}`,
            description: defaultSprintObject.goal || `Sprint ID: ${defaultSprintObject.id}`,
          },
        ]
      : []),
    // Add all loaded sprints
    ...sprints.map((sprint) => ({
      value: sprint.id.toString(),
      label: `${getSprintStateLabel(sprint.state)} ${sprint.name}`,
      description: sprint.goal || `Sprint ID: ${sprint.id}`,
    })),
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
            {/* AI Generation Button */}
            {isGeminiConnected && (
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerateWithAI}
                  disabled={creating || generating || !recording.transcript}
                  className="flex items-center gap-2 text-sm px-3 py-1.5"
                >
                  <span className="text-lg">✨</span>
                  {generating ? "Generating..." : "Generate with AI"}
                </Button>
                {!recording.transcript && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Transcript required for AI generation
                  </p>
                )}
              </div>
            )}
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
              loading={loadingPriorities}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Issue priority (optional)
            </p>
          </div>

          {/* Assignee */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Assignee
            </label>
            <JiraDropdown
              options={assigneeOptions}
              value={assigneeId}
              onChange={setAssigneeId}
              placeholder="Select assignee (optional)"
              disabled={creating || !projectKey}
              loading={loadingUsers}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              User to assign this issue to (optional)
            </p>
          </div>

          {/* Sprint */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Sprint
            </label>
            <JiraDropdown
              options={sprintOptions}
              value={sprintId}
              onChange={setSprintId}
              placeholder="Select sprint (optional)"
              disabled={creating}
              loading={loadingSprints}
              onOpen={loadSprints}
            />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Sprint to assign this issue to (optional)
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
              disabled={
                creating || !projectKey || !summary.trim() || !issueTypeName
              }
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
