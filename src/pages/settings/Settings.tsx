import React from "react";
import "../../index.css";
import MainApplicationHeader from "../../components/MainApplicationHeader";
import Breadcrumb from "../../components/Breadcrumb";
import SettingsCard from "../../components/SettingsCard";
import JiraProfile from "../../components/jira/JiraProfile";
import GeminiProfile from "../../components/gemini/GeminiProfile";
import Button from "../../components/Button";
import ThemeSlider from "../../components/ThemeSlider";
import DefaultProjectSetting from "./components/DefaultProjectSetting";
import DefaultPrioritySetting from "./components/DefaultPrioritySetting";
import DefaultAssigneeSetting from "./components/DefaultAssigneeSetting";
import DefaultSprintSetting from "./components/DefaultSprintSetting";
import { useTheme } from "../../hooks/useTheme";
import { useJiraConnection } from "./hooks/useJiraConnection";
import { useGeminiConnection } from "./hooks/useGeminiConnection";
import { useJiraProjects } from "./hooks/useJiraProjects";
import { useJiraPriorities } from "./hooks/useJiraPriorities";
import { useJiraUsers } from "./hooks/useJiraUsers";
import { useJiraSprints } from "./hooks/useJiraSprints";
import { useRecordings } from "../recordings/hooks/useRecordings";

const Settings: React.FC = () => {
  const { theme, setTheme, loading: themeLoading } = useTheme();
  const { isJiraConnected, handleConnect, handleDisconnect } =
    useJiraConnection();
  const {
    isGeminiConnected,
    handleConnect: handleGeminiConnect,
    handleDisconnect: handleGeminiDisconnect,
  } = useGeminiConnection();
  const {
    jiraProjects,
    defaultProject,
    loadingProjects,
    handleDefaultProjectChange,
  } = useJiraProjects(isJiraConnected);
  const {
    priorities,
    defaultPriority,
    loadingPriorities,
    handlePriorityChange,
  } = useJiraPriorities(isJiraConnected);
  const { users, defaultAssignee, loadingUsers, handleAssigneeChange } =
    useJiraUsers(isJiraConnected, defaultProject);
  const {
    sprints,
    defaultSprint,
    loadingSprints,
    handleDefaultSprintChange,
  } = useJiraSprints(isJiraConnected);
  const { clearAllRecordings } = useRecordings();

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <MainApplicationHeader
        title="Settings"
        subtitle="Manage your preferences and integrations"
      />

      <div className="px-10 py-6 max-w-[1200px] mx-auto">
        <Breadcrumb
          items={[{ label: "Recordings", path: "/" }, { label: "Settings" }]}
        />

        <div className="space-y-8">
          {/* Application Settings Section */}
          <SettingsCard title="Application Settings">
            <div className="space-y-6">
              {/* Theme Setting */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Theme
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Choose your preferred color scheme. System will match your
                  operating system settings.
                </p>
                {themeLoading ? (
                  <div className="h-11 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse w-80" />
                ) : (
                  <ThemeSlider value={theme} onChange={setTheme} />
                )}
              </div>
            </div>
          </SettingsCard>

          {/* Jira Integration Section */}
          <SettingsCard
            title="Jira Integration"
            description="Connect your Jira account to create issues and attach recordings directly from this extension."
          >
            {isJiraConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <JiraProfile clickable={false} />
                  <Button
                    variant="error"
                    rounded={"full"}
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Your Jira account is connected and ready to use.
                  </p>
                </div>

                {/* Default Jira Settings */}
                <DefaultProjectSetting
                  jiraProjects={jiraProjects}
                  defaultProject={defaultProject}
                  loadingProjects={loadingProjects}
                  onProjectChange={handleDefaultProjectChange}
                />

                <DefaultPrioritySetting
                  priorities={priorities}
                  defaultPriority={defaultPriority}
                  loadingPriorities={loadingPriorities}
                  onPriorityChange={handlePriorityChange}
                />

                <DefaultAssigneeSetting
                  users={users}
                  defaultAssignee={defaultAssignee}
                  loadingUsers={loadingUsers}
                  onAssigneeChange={handleAssigneeChange}
                />

                <DefaultSprintSetting
                  sprints={sprints}
                  defaultSprint={defaultSprint}
                  loadingSprints={loadingSprints}
                  onSprintChange={handleDefaultSprintChange}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="primary" onClick={handleConnect}>
                  Connect with Jira
                </Button>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Connect your Jira account to enable issue creation and
                    attachment features.
                  </p>
                </div>
              </div>
            )}
          </SettingsCard>

          {/* Gemini AI Integration Section */}
          <SettingsCard
            title="Gemini AI Integration"
            description="Connect Google Gemini to automatically generate issue descriptions and summaries using AI."
          >
            {isGeminiConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <GeminiProfile clickable={false} />
                  <Button
                    variant="error"
                    rounded="full"
                    onClick={handleGeminiDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Gemini AI is connected and ready to use.
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                    You can now use AI to generate descriptions when creating
                    Jira issues.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="primary" onClick={handleGeminiConnect}>
                  Connect with Gemini
                </Button>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Connect Gemini AI to automatically generate professional
                    issue descriptions from your recordings.
                  </p>
                </div>

                {/* Setup Instructions */}
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Setup Instructions
                  </h4>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
                    <li>
                      Go to{" "}
                      <a
                        href="https://console.cloud.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Google Cloud Console
                      </a>
                    </li>
                    <li>Create a new project or select an existing one</li>
                    <li>Enable the "Generative Language API"</li>
                    <li>Go to "Credentials" and create an OAuth 2.0 Client ID</li>
                    <li>Select "Chrome Extension" as application type</li>
                    <li>Enter your Extension ID (see below)</li>
                    <li>
                      Add the Client ID to your .env file as
                      VITE_GEMINI_CLIENT_ID
                    </li>
                    <li>Update manifest.json with the same Client ID</li>
                    <li>Rebuild and reload the extension</li>
                  </ol>
                  <div className="mt-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Your Extension ID:
                    </p>
                    <code className="text-xs text-slate-900 dark:text-slate-100 font-mono break-all">
                      {chrome.runtime.id}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </SettingsCard>

          {/* Recording Settings Section */}
          <SettingsCard
            title="Recording Settings"
            description="Manage your recording history and preferences"
          >
            <div className="space-y-4">
              {/* Clear All History */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Clear Recording History
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Permanently delete all recordings and their associated data.
                  This action cannot be undone.
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Files will remain on computer but will no longer be seen by
                  extension.
                </p>
                <Button
                  variant="error"
                  rounded="full"
                  onClick={clearAllRecordings}
                >
                  Clear All Recording History
                </Button>
              </div>
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
};

export default Settings;
