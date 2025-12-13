import React, { useState, useEffect } from "react";
import JiraConnect from "./JiraConnect";
import JiraProfile from "./JiraProfile";
import { jiraAuth } from "../utils/jiraAuth";

interface MainApplicationHeaderProps {
  title: string;
  subtitle: string;
}

const MainApplicationHeader: React.FC<MainApplicationHeaderProps> = ({
  title,
  subtitle,
}) => {
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

  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-10 py-8">
      <div className="flex justify-between items-center max-w-[1250px] mx-auto">
        <div className="flex flex-col">
          <h1 className="m-0 text-2xl font-medium text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          {isJiraConnected ? (
            <JiraProfile showDisconnect={false} />
          ) : (
            <JiraConnect />
          )}
        </div>
      </div>
    </div>
  );
};

export default MainApplicationHeader;
