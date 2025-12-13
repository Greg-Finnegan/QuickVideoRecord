import { useState, useEffect } from "react";
import { jiraAuth } from "../../../utils/jiraAuth";

/**
 * Hook to manage Jira connection status and authentication
 */
export const useJiraConnection = () => {
  const [isJiraConnected, setIsJiraConnected] = useState(false);

  useEffect(() => {
    checkJiraConnection();

    // Listen for storage changes to detect when Jira connection changes
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.jiraTokens) {
        checkJiraConnection();
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, []);

  const checkJiraConnection = async () => {
    const connected = await jiraAuth.isAuthenticated();
    setIsJiraConnected(connected);
  };

  const handleConnect = async () => {
    await jiraAuth.authenticate();
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect from Jira?")) {
      await jiraAuth.disconnect();
    }
  };

  return {
    isJiraConnected,
    handleConnect,
    handleDisconnect,
  };
};
