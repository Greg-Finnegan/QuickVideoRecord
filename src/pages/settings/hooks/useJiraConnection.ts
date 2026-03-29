import { useState, useEffect } from "react";
import { jiraAuth } from "../../../utils/jiraAuth";
import { jiraService } from "../../../utils/jiraService";

/**
 * Hook to manage Jira connection status and authentication
 */
export const useJiraConnection = () => {
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isStartProtoUser, setIsStartProtoUser] = useState(true);

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
    if (connected) {
      try {
        const user = await jiraService.getCurrentUser();
        const email = user.emailAddress || "";
        setIsStartProtoUser(email.endsWith("@startproto.com"));
      } catch {
        setIsStartProtoUser(false);
      }
    } else {
      setIsStartProtoUser(false);
    }
  };

  const handleConnect = async () => {
    setConnectionError(null);
    const result = await jiraAuth.authenticate();
    if (!result.success) {
      setConnectionError(result.error);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect from Jira?")) {
      await jiraAuth.disconnect();
    }
  };

  return {
    isJiraConnected,
    isStartProtoUser,
    connectionError,
    handleConnect,
    handleDisconnect,
  };
};
