import React, { useState } from "react";
import JiraConnect from "./jira/JiraConnect";
import JiraProfile from "./jira/JiraProfile";
import { useJiraConnection } from "../pages/settings/hooks/useJiraConnection";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Icon from "./Icon";
import CreateJiraIssueModal from "./jira/CreateJiraIssueModal";
import type { ToggleSidePanelMessage } from "../types";

interface MainApplicationHeaderProps {
  title: string;
  subtitle: string;
}

const MainApplicationHeader: React.FC<MainApplicationHeaderProps> = ({
  title,
  subtitle,
}) => {
  const navigate = useNavigate();
  const { isJiraConnected } = useJiraConnection();
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [defaultProjectKey, setDefaultProjectKey] = useState("");

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
              chrome.runtime.sendMessage({
                action: "toggleSidePanel",
              } satisfies ToggleSidePanelMessage)
            }
            title="Toggle side panel"
            aria-label="Toggle side panel"
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
