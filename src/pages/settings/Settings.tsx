import React from "react";
import "../../index.css";
import MainApplicationHeader from "../../components/MainApplicationHeader";
import Breadcrumb from "../../components/Breadcrumb";
import SettingsCard from "../../components/SettingsCard";
import JiraProfile from "../../components/jira/JiraProfile";
import JiraDropdown from "../../components/jira/JiraDropdown";
import Button from "../../components/Button";
import ThemeSlider from "../../components/ThemeSlider";
import { useTheme } from "../../hooks/useTheme";
import { useJiraConnection } from "./hooks/useJiraConnection";
import { useJiraProjects } from "./hooks/useJiraProjects";
import { useRecordings } from "../recordings/hooks/useRecordings";
import type { JiraProjectOption } from "../../types";

const Settings: React.FC = () => {
  const { theme, setTheme, loading: themeLoading } = useTheme();
  const { isJiraConnected, handleConnect, handleDisconnect } =
    useJiraConnection();
  const {
    jiraProjects,
    defaultProject,
    loadingProjects,
    handleDefaultProjectChange,
  } = useJiraProjects(isJiraConnected);
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

                {/* Default Project Selection */}
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Default Project
                  </label>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Select the default Jira project for tickets created by this
                    extension.
                  </p>
                  <JiraDropdown
                    options={jiraProjects.map(
                      (project): JiraProjectOption => ({
                        value: project.key || "",
                        label: project.name || "Unnamed Project",
                        description: project.key || "",
                        project: project,
                      })
                    )}
                    value={defaultProject}
                    onChange={handleDefaultProjectChange}
                    placeholder="Select a project..."
                    loading={loadingProjects}
                  />
                  {defaultProject && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Selected:{" "}
                      {jiraProjects.find((p) => p.key === defaultProject)
                        ?.name || defaultProject}
                    </p>
                  )}
                </div>
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
