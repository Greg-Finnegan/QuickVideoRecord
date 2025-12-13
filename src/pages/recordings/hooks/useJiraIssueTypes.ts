import { useState, useEffect } from "react";
import { jiraService } from "../../../utils/jiraService";
import type { Version3Models } from "jira.js";

/**
 * Hook to fetch and manage issue types for a selected Jira project
 * Re-fetches when projectKey changes
 */
export const useJiraIssueTypes = (projectKey: string | undefined) => {
  const [issueTypes, setIssueTypes] = useState<
    Version3Models.IssueTypeDetails[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectKey) {
      setIssueTypes([]);
      setError(null);
      return;
    }

    const loadIssueTypes = async () => {
      setLoading(true);
      setError(null);

      try {
        const types = await jiraService.getIssueTypes(projectKey);
        setIssueTypes(types);
      } catch (err) {
        console.error("Failed to load issue types:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load issue types"
        );
        setIssueTypes([]);
      } finally {
        setLoading(false);
      }
    };

    loadIssueTypes();
  }, [projectKey]);

  return {
    issueTypes,
    loading,
    error,
  };
};
