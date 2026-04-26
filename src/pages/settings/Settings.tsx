import React from "react";
import "../../index.css";
import MainApplicationHeader from "../../components/MainApplicationHeader";
import Breadcrumb from "../../components/Breadcrumb";
import SettingsCard from "../../components/SettingsCard";
import JiraProfile from "../../components/jira/JiraProfile";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import ThemeSlider from "../../components/ThemeSlider";
import DefaultProjectSetting from "./components/DefaultProjectSetting";
import DefaultPrioritySetting from "./components/DefaultPrioritySetting";
import DefaultAssigneeSetting from "./components/DefaultAssigneeSetting";
import DefaultSprintSetting from "./components/DefaultSprintSetting";
import AiPromptSetting from "./components/AiPromptSetting";
import AiProviderSetting from "./components/AiProviderSetting";
import { useTheme } from "../../hooks/useTheme";
import { useJiraConnection } from "./hooks/useJiraConnection";
import { useJiraProjects } from "./hooks/useJiraProjects";
import { useJiraPriorities } from "./hooks/useJiraPriorities";
import { useJiraUsers } from "./hooks/useJiraUsers";
import { useJiraSprints } from "./hooks/useJiraSprints";
import { useAiSettings } from "./hooks/useAiSettings";
import { useRecordings } from "../recordings/hooks/useRecordings";
import { useDevMode } from "../../hooks/useDevMode";
import SummarizerToggle from "./SummarizerToggle";

const Settings: React.FC = () => {
  const { theme, setTheme, loading: themeLoading } = useTheme();
  const { isJiraConnected, isStartProtoUser, connectionError, handleConnect, handleDisconnect } =
    useJiraConnection();
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
  const { aiProvider, aiPrompt, handleProviderChange, handlePromptChange } = useAiSettings();
  const { clearAllRecordings } = useRecordings();
  const { devMode, setDevMode } = useDevMode();

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
          {/* AI Integration Section */}
          <SettingsCard
            title="AI Integration"
            description='Choose your preferred AI provider and customize the prompt prepended to your transcript. No data is automatically sent to any provider. You must click the "Open in" button, which transfers your prompt + transcript via URL parameters if the provider supports it.'
          >
            <div className="space-y-6">
              <AiProviderSetting
                provider={aiProvider}
                onProviderChange={handleProviderChange}
              />
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <AiPromptSetting
                  prompt={aiPrompt}
                  onPromptChange={handlePromptChange}
                />
              </div>

              {/* Auto-Generate Filenames */}
              <SummarizerToggle />
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
                {connectionError ? (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {connectionError}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Connect your Jira account to enable issue creation and
                      attachment features.
                    </p>
                  </div>
                )}
              </div>
            )}
          </SettingsCard>
          {/* Application Settings Section */}
          <SettingsCard title="Application Settings">
            <div className="space-y-6">
              {/* Theme Setting */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
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

              {/* Dev Mode */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    Developer Mode
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={devMode}
                    onClick={() => setDevMode(!devMode)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${devMode ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${devMode ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Show raw recording data in the video player for debugging.
                </p>
              </div>

              {/* Discord Community */}
              {!isStartProtoUser && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                    Join the Community
                  </label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Have a feature idea or need help? Join our Discord community to
                    request features, report bugs, and get support from the team.
                  </p>
                  <Button
                    variant="secondary"
                    rounded="full"
                    onClick={() =>
                      window.open("https://discord.gg/MmAk8BScWg", "_blank")
                    }
                  >
                    <span className="flex items-center gap-2">
                      <Icon name="external-link" size={16} />
                      Join our Discord
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </SettingsCard>
          {/* Recording Settings Section */}
          <SettingsCard
            title="Recording Settings"
            description="Manage your recording history and preferences"
          >
            <div className="space-y-4">
              {/* Clear All History */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
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
