import React, { useState, useEffect } from "react";
import JiraConnect from "../../components/JiraConnect";
import JiraProfile from "../../components/JiraProfile";
import { jiraAuth } from "../../utils/jiraAuth";

const RecordingsHeader: React.FC = () => {
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
            Recording History
          </h1>
          <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
            View and manage your screen recordings
          </p>
        </div>
        <div className="mt-2 flex items-center gap-3">
          {isJiraConnected ? <JiraProfile /> : <JiraConnect />}
        </div>
      </div>
    </div>
  );
};

export default RecordingsHeader;
