import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useJiraConnection } from "../../../pages/settings/hooks/useJiraConnection";
import { useJiraProjects } from "../../../pages/settings/hooks/useJiraProjects";
import { useJiraIssueTypes } from "../../../pages/recordings/hooks/useJiraIssueTypes";
import { useJiraIssueCreation } from "../../../pages/recordings/hooks/useJiraIssueCreation";
import { useJiraPriorities } from "../../../pages/settings/hooks/useJiraPriorities";
import { useJiraUsers } from "../../../pages/settings/hooks/useJiraUsers";
import { useJiraSprints } from "../../../pages/settings/hooks/useJiraSprints";
import { getSprintStateLabel, parseLabels } from "../../../utils/jiraHelpers";
import { formatDate } from "../../../pages/recordings/utils/formatters";
import type { Recording, CreateIssueFormData, JiraDraft } from "../../../types";
import type { RecordingStorage } from "../../../types/recording";

export const useCreateIssueForm = (
  recording: Recording,
  defaultProjectKey?: string
) => {
  const draft = recording.jiraDraft;

  const { isJiraConnected } = useJiraConnection();
  const { jiraProjects, loadingProjects } = useJiraProjects(isJiraConnected);

  const [projectKey, setProjectKey] = useState(
    draft?.projectKey ?? defaultProjectKey ?? ""
  );
  const [issueTypeName, setIssueTypeName] = useState(
    draft?.issueTypeName ?? ""
  );
  const [defaultIssueType, setDefaultIssueType] = useState("Task");
  const [summary, setSummary] = useState(
    draft?.summary ?? recording.filename
  );
  const [description, setDescription] = useState(
    draft?.description ??
      `Recording captured on ${formatDate(recording.timestamp)}${recording.transcript ? `\n\nTranscript:\n${recording.transcript}` : ""}`
  );
  const [priority, setPriority] = useState(draft?.priority ?? "");
  const [assigneeId, setAssigneeId] = useState(draft?.assigneeId ?? "");
  const [sprintId, setSprintId] = useState(draft?.sprintId ?? "");
  const [labelsInput, setLabelsInput] = useState(draft?.labelsInput ?? "");
  const [attachVideo, setAttachVideo] = useState(draft?.attachVideo ?? true);

  const { issueTypes, loading: loadingIssueTypes } =
    useJiraIssueTypes(projectKey);
  const { creating, error, createIssue } = useJiraIssueCreation();
  const { priorities, defaultPriority, loadingPriorities } =
    useJiraPriorities(isJiraConnected);
  const { users, defaultAssignee, loadingUsers } = useJiraUsers(
    isJiraConnected,
    projectKey
  );
  const {
    sprints,
    defaultSprint,
    loadingSprints,
    loadSprints,
  } = useJiraSprints(isJiraConnected, { lazy: true });

  // Load default issue type from storage
  const issueTypeDefaultApplied = useRef(!!draft?.issueTypeName);

  useEffect(() => {
    chrome.storage.local.get("defaultJiraIssueType").then((result: { [key: string]: unknown }) => {
      const value = result.defaultJiraIssueType;
      if (typeof value === "string") {
        setDefaultIssueType(value);
      }
    });
  }, []);

  // Track each default independently so late-arriving defaults still apply
  // Skip if draft already provided a value
  const priorityDefaultApplied = useRef(draft?.priority != null);
  const assigneeDefaultApplied = useRef(draft?.assigneeId != null);
  const sprintDefaultApplied = useRef(draft?.sprintId != null);

  useEffect(() => {
    if (!priorityDefaultApplied.current && defaultPriority) {
      setPriority(defaultPriority);
      priorityDefaultApplied.current = true;
    }
  }, [defaultPriority]);

  useEffect(() => {
    if (!assigneeDefaultApplied.current && defaultAssignee) {
      setAssigneeId(defaultAssignee);
      assigneeDefaultApplied.current = true;
    }
  }, [defaultAssignee]);

  useEffect(() => {
    if (!sprintDefaultApplied.current && defaultSprint && defaultSprint.id != null) {
      setSprintId(defaultSprint.id.toString());
      sprintDefaultApplied.current = true;
    }
  }, [defaultSprint]);

  useEffect(() => {
    if (issueTypes.length > 0 && !issueTypeDefaultApplied.current) {
      const preferredType = issueTypes.find((type) => type.name === defaultIssueType);
      setIssueTypeName(preferredType ? preferredType.name! : issueTypes[0].name!);
      issueTypeDefaultApplied.current = true;
    }
  }, [issueTypes, defaultIssueType]);

  // ── Draft auto-save ──────────────────────────────────────────────────────

  // Use refs for text fields so saveDraft always reads the latest values
  // without needing them in the useCallback dependency array
  const summaryRef = useRef(summary);
  const descriptionRef = useRef(description);
  const labelsInputRef = useRef(labelsInput);

  useEffect(() => { summaryRef.current = summary; }, [summary]);
  useEffect(() => { descriptionRef.current = description; }, [description]);
  useEffect(() => { labelsInputRef.current = labelsInput; }, [labelsInput]);

  const saveDraftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(async () => {
    const draftData: JiraDraft = {
      projectKey,
      issueTypeName,
      summary: summaryRef.current,
      description: descriptionRef.current,
      priority,
      assigneeId,
      sprintId,
      labelsInput: labelsInputRef.current,
      attachVideo,
    };
    const result = await chrome.storage.local.get("recordings") as RecordingStorage;
    const allRecordings = result.recordings || [];
    const updatedRecordings = allRecordings.map((r) =>
      r.id === recording.id
        ? { ...r, jiraDraft: draftData, filename: summaryRef.current || r.filename }
        : r
    );
    await chrome.storage.local.set({ recordings: updatedRecordings });
  }, [projectKey, issueTypeName, priority, assigneeId, sprintId, attachVideo, recording.id]);

  const saveDraftDebounced = useCallback(() => {
    if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
    saveDraftTimeoutRef.current = setTimeout(saveDraft, 500);
  }, [saveDraft]);

  // Auto-save when dropdown/checkbox values change (skip initial render)
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    saveDraftDebounced();
  }, [projectKey, issueTypeName, priority, assigneeId, sprintId, attachVideo, saveDraftDebounced]);

  // Flush any pending debounced save on unmount
  useEffect(() => {
    return () => {
      if (saveDraftTimeoutRef.current) {
        clearTimeout(saveDraftTimeoutRef.current);
        saveDraft();
      }
    };
  }, [saveDraft]);

  // Flush pending debounced save, then save immediately with latest text values
  const onFieldBlur = useCallback(() => {
    if (saveDraftTimeoutRef.current) clearTimeout(saveDraftTimeoutRef.current);
    saveDraft();
  }, [saveDraft]);

  // ── Options ──────────────────────────────────────────────────────────────

  const projectOptions = useMemo(
    () =>
      jiraProjects.map((project) => ({
        value: project.key || "",
        label: project.name || "",
        description: project.key,
      })),
    [jiraProjects]
  );

  const issueTypeOptions = useMemo(
    () =>
      issueTypes.map((type) => ({
        value: type.name || "",
        label: type.name || "",
        description: type.description,
      })),
    [issueTypes]
  );

  const priorityOptions = useMemo(
    () => [
      { value: "", label: "None", description: "No priority" },
      ...priorities.map((p) => ({
        value: p.id || "",
        label: p.name || "",
        description: p.description || "",
      })),
    ],
    [priorities]
  );

  const assigneeOptions = useMemo(
    () => [
      { value: "", label: "Unassigned", description: "No assignee" },
      ...users.map((user) => ({
        value: user.accountId || "",
        label: user.displayName || "Unknown User",
        description: user.emailAddress || "",
      })),
    ],
    [users]
  );

  const sprintOptions = useMemo(() => {
    const defaultSprintNotInList =
      defaultSprint &&
      defaultSprint.id != null &&
      !sprints.some((s) => s.id === defaultSprint.id);

    return [
      {
        value: "",
        label: "No Sprint",
        description: "Not assigned to a sprint",
      },
      ...(defaultSprintNotInList
        ? [
          {
            value: defaultSprint.id.toString(),
            label: `${getSprintStateLabel(defaultSprint.state)} ${defaultSprint.name}`,
            description:
              defaultSprint.goal || `Sprint ID: ${defaultSprint.id}`,
          },
        ]
        : []),
      ...sprints.map((sprint) => ({
        value: sprint.id.toString(),
        label: `${getSprintStateLabel(sprint.state)} ${sprint.name}`,
        description: sprint.goal || `Sprint ID: ${sprint.id}`,
      })),
    ];
  }, [sprints, defaultSprint]);

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
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

    const result = await createIssue(formData);

    // Clear draft on successful submit
    if (result) {
      const storageResult = await chrome.storage.local.get("recordings") as RecordingStorage;
      const allRecordings = storageResult.recordings || [];
      const cleaned = allRecordings.map((r) =>
        r.id === recording.id ? { ...r, jiraDraft: undefined } : r
      );
      await chrome.storage.local.set({ recordings: cleaned });
    }

    return result;
  };

  // ── Save defaults ────────────────────────────────────────────────────────

  const saveDefaultIssueType = async () => {
    await chrome.storage.local.set({ defaultJiraIssueType: issueTypeName });
    setDefaultIssueType(issueTypeName);
  };

  const saveDefaultProject = async () => {
    await chrome.storage.local.set({ defaultJiraProject: projectKey });
  };

  const saveDefaultPriority = async () => {
    await chrome.storage.local.set({ defaultJiraPriority: priority });
  };

  const saveDefaultAssignee = async () => {
    await chrome.storage.local.set({ defaultJiraAssignee: assigneeId });
  };

  const saveDefaultSprint = async () => {
    const sprint = sprints.find((s) => s.id.toString() === sprintId) || defaultSprint;
    if (sprint) {
      await chrome.storage.local.set({ defaultJiraSprint: sprint });
    } else {
      await chrome.storage.local.set({ defaultJiraSprint: null });
    }
  };

  return {
    projectKey,
    setProjectKey,
    issueTypeName,
    setIssueTypeName,
    summary,
    setSummary,
    description,
    setDescription,
    priority,
    setPriority,
    assigneeId,
    setAssigneeId,
    sprintId,
    setSprintId,
    labelsInput,
    setLabelsInput,
    attachVideo,
    setAttachVideo,
    projectOptions,
    issueTypeOptions,
    priorityOptions,
    assigneeOptions,
    sprintOptions,
    loadingProjects,
    loadingIssueTypes,
    loadingPriorities,
    loadingUsers,
    loadingSprints,
    handleSubmit,
    loadSprints,
    creating,
    error,
    defaultIssueType,
    saveDefaultIssueType,
    defaultProjectKey: defaultProjectKey ?? "",
    defaultPriority: defaultPriority || "",
    defaultAssignee: defaultAssignee || "",
    defaultSprintId: defaultSprint?.id?.toString() || "",
    saveDefaultProject,
    saveDefaultPriority,
    saveDefaultAssignee,
    saveDefaultSprint,
    onFieldBlur,
  };
};
