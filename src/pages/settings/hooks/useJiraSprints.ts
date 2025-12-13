import { useState, useEffect } from "react";
import { jiraService } from "../../../utils/jiraService";
import type { JiraSettingsStorage, JiraSprint } from "../../../types";

/**
 * Hook to manage Jira sprints and default sprint selection
 */
export const useJiraSprints = (isJiraConnected: boolean) => {
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [defaultSprint, setDefaultSprint] = useState<string>("");
  const [loadingSprints, setLoadingSprints] = useState(false);

  // Load default sprint on mount
  useEffect(() => {
    loadDefaultSprint();

    // Listen for default sprint changes in storage
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.defaultJiraSprint) {
        const newValue = changes.defaultJiraSprint.newValue;
        setDefaultSprint(typeof newValue === "string" ? newValue : "");
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, []);

  // Load sprints when Jira connection status changes
  useEffect(() => {
    if (isJiraConnected) {
      loadJiraSprints();
    } else {
      setSprints([]);
      setDefaultSprint("");
    }
  }, [isJiraConnected]);

  const loadJiraSprints = async () => {
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
    } catch (error) {
      console.error("Failed to load Jira sprints:", error);
      setSprints([]);
    } finally {
      setLoadingSprints(false);
    }
  };

  const loadDefaultSprint = async () => {
    try {
      const result = (await chrome.storage.local.get(
        "defaultJiraSprint"
      )) as JiraSettingsStorage;
      if (result.defaultJiraSprint) {
        setDefaultSprint(result.defaultJiraSprint);
      }
    } catch (error) {
      console.error("Failed to load default sprint:", error);
    }
  };

  const handleDefaultSprintChange = async (sprintId: string) => {
    setDefaultSprint(sprintId);
    try {
      await chrome.storage.local.set({ defaultJiraSprint: sprintId });
    } catch (error) {
      console.error("Failed to save default sprint:", error);
    }
  };

  return {
    sprints,
    defaultSprint,
    loadingSprints,
    handleDefaultSprintChange,
  };
};
