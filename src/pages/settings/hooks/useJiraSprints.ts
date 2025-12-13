import { useState, useEffect } from "react";
import { jiraService } from "../../../utils/jiraService";

interface Sprint {
  id: number;
  name: string;
  state: string;
}

/**
 * Hook for managing Jira sprint settings
 * Loads active sprints for the selected project
 */
export const useJiraSprints = (
  isConnected: boolean,
  projectKey?: string
) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [defaultSprint, setDefaultSprint] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load sprints when project changes
  useEffect(() => {
    const loadSprints = async () => {
      if (!isConnected || !projectKey) {
        setSprints([]);
        return;
      }

      setLoading(true);
      try {
        // Get boards for the project
        const boards = await jiraService.getBoards(projectKey);
        if (boards.length === 0) {
          setSprints([]);
          return;
        }

        // Get sprints for the first board
        const boardId = boards[0].id;
        if (boardId) {
          const allSprints = await jiraService.getSprints(boardId);
          // Filter to only active sprints
          const activeSprints = allSprints.filter(
            (sprint: Sprint) => sprint.state === "active"
          );
          setSprints(activeSprints);
        }
      } catch (error) {
        console.error("Failed to load sprints:", error);
        setSprints([]);
      } finally {
        setLoading(false);
      }
    };

    loadSprints();
  }, [isConnected, projectKey]);

  // Load default sprint from storage
  useEffect(() => {
    const loadDefaultSprint = async () => {
      try {
        const result = await chrome.storage.local.get("defaultJiraSprint");
        if (result.defaultJiraSprint) {
          setDefaultSprint(result.defaultJiraSprint);
        }
      } catch (error) {
        console.error("Failed to load default sprint:", error);
      }
    };

    loadDefaultSprint();
  }, []);

  const handleSprintChange = async (sprintId: string) => {
    setDefaultSprint(sprintId);
    await chrome.storage.local.set({ defaultJiraSprint: sprintId });
  };

  return {
    sprints,
    defaultSprint,
    loadingSprints: loading,
    handleSprintChange,
  };
};
