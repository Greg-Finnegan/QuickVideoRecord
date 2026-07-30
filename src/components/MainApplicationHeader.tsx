import React, { useState, useEffect } from "react";
import JiraConnect from "./jira/JiraConnect";
import JiraProfile from "./jira/JiraProfile";
import { jiraAuth } from "../utils/jiraAuth";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Icon from "./Icon";
import CreateJiraIssueModal from "./jira/CreateJiraIssueModal";

interface MainApplicationHeaderProps {
  title: string;
  subtitle: string;
}

const MainApplicationHeader: React.FC<MainApplicationHeaderProps> = ({
  title,
  subtitle,
}) => {
  const navigate = useNavigate();
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [defaultProjectKey, setDefaultProjectKey] = useState("");

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

  const handleQuickCreate = async () => {
    const result = await chrome.storage.local.get("defaultJiraProject");
    setDefaultProjectKey(
      typeof result.defaultJiraProject === "string"
        ? result.defaultJiraProject
        : ""
    );
    setShowQuickCreate(true);
  };

  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-5 py-4">
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
          {isJiraConnected && (
            <Button
              variant="primary"
              rounded="full"
              onClick={handleQuickCreate}
              title="Create Jira issue"
              className="px-4 py-2"
            >
              <Icon name="plus" size={16} />
            </Button>
          )}
          <Button
            variant="secondary"
            rounded="full"
            onClick={() => navigate("/settings")}
            title="Open settings"
            className="px-4 py-2"
          >
            <Icon name="settings" size={16} />
          </Button>
          <Button
            variant="secondary"
            rounded="full"
            onClick={() =>
              chrome.runtime.sendMessage({ action: "openSidePanel" })
            }
            className="px-4 py-2"
          >
            <Icon name="panel-left-close" size={16} />
          </Button>
        </div>
      </div>
      {showQuickCreate && (
        <CreateJiraIssueModal
          onClose={() => setShowQuickCreate(false)}
          onSuccess={(_issueKey, issueUrl) => {
            setShowQuickCreate(false);
            window.open(issueUrl, "_blank", "noopener,noreferrer");
          }}
          defaultProjectKey={defaultProjectKey}
        />
      )}
    </div>
  );
};

export default MainApplicationHeader;
