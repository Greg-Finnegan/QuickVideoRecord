import { useState, useEffect } from "react";
import { jiraService } from "../../../utils/jiraService";
import type { JiraSettingsStorage } from "../../../types";
import type { Version3Models } from "jira.js";

/**
 * Hook to manage Jira projects and default project selection
 */
export const useJiraProjects = (isJiraConnected: boolean) => {
  const [jiraProjects, setJiraProjects] = useState<Version3Models.Project[]>([]);
  const [defaultProject, setDefaultProject] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load default project on mount
  useEffect(() => {
    loadDefaultProject();

    // Listen for default project changes in storage
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.defaultJiraProject) {
        const newValue = changes.defaultJiraProject.newValue;
        setDefaultProject(typeof newValue === "string" ? newValue : "");
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, []);

  // Load projects when Jira connection status changes
  useEffect(() => {
    if (isJiraConnected) {
      loadJiraProjects();
    } else {
      setJiraProjects([]);
      setDefaultProject("");
    }
  }, [isJiraConnected]);

  const loadJiraProjects = async () => {
    setLoadingProjects(true);
    try {
      const projects = await jiraService.getProjects();
      setJiraProjects(projects);
    } catch (error) {
      console.error("Failed to load Jira projects:", error);
      setJiraProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadDefaultProject = async () => {
    try {
      const result = (await chrome.storage.local.get(
        "defaultJiraProject"
      )) as JiraSettingsStorage;
      if (result.defaultJiraProject) {
        setDefaultProject(result.defaultJiraProject);
      }
    } catch (error) {
      console.error("Failed to load default project:", error);
    }
  };

  const handleDefaultProjectChange = async (projectKey: string) => {
    setDefaultProject(projectKey);
    try {
      await chrome.storage.local.set({ defaultJiraProject: projectKey });
    } catch (error) {
      console.error("Failed to save default project:", error);
    }
  };

  return {
    jiraProjects,
    defaultProject,
    loadingProjects,
    handleDefaultProjectChange,
  };
};
