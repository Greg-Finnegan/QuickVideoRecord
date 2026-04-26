import { useState, useEffect } from "react";

/**
 * Hook for managing the default Jira issue type setting
 */
export const useJiraIssueType = () => {
  const [defaultIssueType, setDefaultIssueType] = useState("Task");

  useEffect(() => {
    chrome.storage.local.get("defaultJiraIssueType").then((result) => {
      if (result.defaultJiraIssueType) {
        setDefaultIssueType(result.defaultJiraIssueType);
      }
    });
  }, []);

  const handleIssueTypeChange = async (issueTypeName: string) => {
    setDefaultIssueType(issueTypeName);
    await chrome.storage.local.set({ defaultJiraIssueType: issueTypeName });
  };

  return {
    defaultIssueType,
    handleIssueTypeChange,
  };
};
