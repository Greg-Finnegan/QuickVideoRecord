import { useEffect } from "react";
import { jiraService } from "../../../utils/jiraService";

/**
 * Hook to fetch and log the last 5 Jira issues
 * Just for testing at this point. Used to find method to map sprints.
 */
export const useJiraIssues = (isJiraConnected: boolean) => {
  useEffect(() => {
    if (!isJiraConnected) {
      return;
    }

    const fetchRecentIssues = async () => {
      try {
        // Fetch last 5 issues ordered by creation date descending
        // Query bounded by issues created in the last 365 days
        const result = await jiraService.searchIssues(
          "created >= -365d AND customfield_10020 IS NOT EMPTY ORDER BY created DESC",
          10
        );

        console.log("Jira search result - full payload:", result);
        console.log(
          "Issue IDs:",
          result.map((issue) => issue)
        );
        console.log(
          "Issue Keys:",
          result.map((issue) => issue.key)
        );
      } catch (error) {
        console.error("Failed to fetch recent Jira issues:", error);
      }
    };

    fetchRecentIssues();
  }, [isJiraConnected]);
};
