import { useState, useEffect, useMemo, useRef } from "react";
import { useJiraConnection } from "../../../pages/settings/hooks/useJiraConnection";
import { useJiraProjects } from "../../../pages/settings/hooks/useJiraProjects";
import { useJiraIssueTypes } from "../../../pages/recordings/hooks/useJiraIssueTypes";
import { useJiraIssueCreation } from "../../../pages/recordings/hooks/useJiraIssueCreation";
import { useJiraPriorities } from "../../../pages/settings/hooks/useJiraPriorities";
import { useJiraUsers } from "../../../pages/settings/hooks/useJiraUsers";
import { useJiraSprints } from "../../../pages/settings/hooks/useJiraSprints";
import { getSprintStateLabel, parseLabels } from "../../../utils/jiraHelpers";
import { formatDate } from "../../../pages/recordings/utils/formatters";
import type { Recording, CreateIssueFormData } from "../../../types";

export const useCreateIssueForm = (
  recording: Recording,
  defaultProjectKey?: string
) => {
  const { isJiraConnected } = useJiraConnection();
  const { jiraProjects, loadingProjects } = useJiraProjects(isJiraConnected);

  const [projectKey, setProjectKey] = useState(defaultProjectKey || "");
  const [issueTypeName, setIssueTypeName] = useState("");
  const [defaultIssueType, setDefaultIssueType] = useState("Task");
  const [summary, setSummary] = useState(recording.filename);
  const [description, setDescription] = useState(
    `Recording captured on ${formatDate(recording.timestamp)}${recording.transcript ? `\n\nTranscript:\n${recording.transcript}` : ""}`
  );
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [labelsInput, setLabelsInput] = useState("");
  const [attachVideo, setAttachVideo] = useState(true);

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
  const issueTypeDefaultApplied = useRef(false);

  useEffect(() => {
    chrome.storage.local.get("defaultJiraIssueType").then((result) => {
      if (result.defaultJiraIssueType) {
        setDefaultIssueType(result.defaultJiraIssueType);
      }
    });
  }, []);

  // Track each default independently so late-arriving defaults still apply
  const priorityDefaultApplied = useRef(false);
  const assigneeDefaultApplied = useRef(false);
  const sprintDefaultApplied = useRef(false);

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
    return result;
  };

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
    defaultProjectKey: defaultProjectKey || "",
    defaultPriority: defaultPriority || "",
    defaultAssignee: defaultAssignee || "",
    defaultSprintId: defaultSprint?.id?.toString() || "",
    saveDefaultProject,
    saveDefaultPriority,
    saveDefaultAssignee,
    saveDefaultSprint,
  };
};
