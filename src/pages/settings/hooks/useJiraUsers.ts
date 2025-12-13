import { useState, useEffect } from "react";
import { jiraService } from "../../../utils/jiraService";
import type { Version3Models } from "jira.js";

/**
 * Hook for managing Jira user/assignee settings
 * Loads available users for the selected project and manages default assignee
 */
export const useJiraUsers = (isConnected: boolean, projectKey?: string) => {
  const [users, setUsers] = useState<Version3Models.User[]>([]);
  const [defaultAssignee, setDefaultAssignee] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load users when project changes
  useEffect(() => {
    const loadUsers = async () => {
      if (!isConnected || !projectKey) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const fetchedUsers = await jiraService.getProjectUsers(projectKey);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to load users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isConnected, projectKey]);

  // Load default assignee from storage
  useEffect(() => {
    const loadDefaultAssignee = async () => {
      try {
        const result = await chrome.storage.local.get("defaultJiraAssignee");
        if (result.defaultJiraAssignee) {
          setDefaultAssignee(result.defaultJiraAssignee);
        }
      } catch (error) {
        console.error("Failed to load default assignee:", error);
      }
    };

    loadDefaultAssignee();
  }, []);

  const handleAssigneeChange = async (accountId: string) => {
    setDefaultAssignee(accountId);
    await chrome.storage.local.set({ defaultJiraAssignee: accountId });
  };

  return {
    users,
    defaultAssignee,
    loadingUsers: loading,
    handleAssigneeChange,
  };
};
