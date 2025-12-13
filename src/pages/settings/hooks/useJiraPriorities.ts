import { useState, useEffect } from "react";
import { jiraService } from "../../../utils/jiraService";
import type { Version3Models } from "jira.js";

/**
 * Hook for managing Jira priority settings
 * Loads available priorities and manages default priority selection
 */
export const useJiraPriorities = (isConnected: boolean) => {
  const [priorities, setPriorities] = useState<Version3Models.Priority[]>([]);
  const [defaultPriority, setDefaultPriority] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load priorities when connected
  useEffect(() => {
    const loadPriorities = async () => {
      if (!isConnected) {
        setPriorities([]);
        return;
      }

      setLoading(true);
      try {
        const fetchedPriorities = await jiraService.getPriorities();
        setPriorities(fetchedPriorities);
      } catch (error) {
        console.error("Failed to load priorities:", error);
        setPriorities([]);
      } finally {
        setLoading(false);
      }
    };

    loadPriorities();
  }, [isConnected]);

  // Load default priority from storage
  useEffect(() => {
    const loadDefaultPriority = async () => {
      try {
        const result = await chrome.storage.local.get("defaultJiraPriority");
        if (result.defaultJiraPriority) {
          setDefaultPriority(result.defaultJiraPriority);
        }
      } catch (error) {
        console.error("Failed to load default priority:", error);
      }
    };

    loadDefaultPriority();
  }, []);

  const handlePriorityChange = async (priorityId: string) => {
    setDefaultPriority(priorityId);
    await chrome.storage.local.set({ defaultJiraPriority: priorityId });
  };

  return {
    priorities,
    defaultPriority,
    loadingPriorities: loading,
    handlePriorityChange,
  };
};
