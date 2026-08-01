import { useState, useEffect } from "react";

/**
 * Hook for managing the default Jira issue type setting
 */
export const useJiraIssueType = () => {
  const [defaultIssueType, setDefaultIssueType] = useState("Task");

  useEffect(() => {
    chrome.storage.local.get("defaultJiraIssueType").then((result) => {
      // chrome.storage values are untyped — guard before setting state
      if (typeof result.defaultJiraIssueType === "string") {
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
