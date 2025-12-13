import React, { useState, useEffect } from "react";
import "../../index.css";
import MainApplicationHeader from "../../components/MainApplicationHeader";
import Breadcrumb from "../../components/Breadcrumb";
import SettingsCard from "../../components/SettingsCard";
import JiraProfile from "../../components/jira/JiraProfile";
import JiraDropdown from "../../components/jira/JiraDropdown";
import Button from "../../components/Button";
import ThemeSlider from "../../components/ThemeSlider";
import { jiraAuth } from "../../utils/jiraAuth";
import { jiraService } from "../../utils/jiraService";
import { useTheme } from "../../hooks/useTheme";
import type { JiraProjectOption, JiraSettingsStorage } from "../../types";
import type { Version3Models } from "jira.js";

const Settings: React.FC = () => {
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [jiraProjects, setJiraProjects] = useState<Version3Models.Project[]>(
    []
  );
  const [defaultProject, setDefaultProject] = useState<string>("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { theme, setTheme, loading: themeLoading } = useTheme();

  useEffect(() => {
    checkJiraConnection();
    loadDefaultProject();

    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.jiraTokens) {
        checkJiraConnection();
      }
      if (changes.defaultJiraProject) {
        const newValue = changes.defaultJiraProject.newValue;
        setDefaultProject(typeof newValue === "string" ? newValue : "");
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, []);

  useEffect(() => {
    if (isJiraConnected) {
      loadJiraProjects();
    } else {
      setJiraProjects([]);
      setDefaultProject("");
    }
  }, [isJiraConnected]);

  const checkJiraConnection = async () => {
    const connected = await jiraAuth.isAuthenticated();
    setIsJiraConnected(connected);
  };

  const loadJiraProjects = async () => {
    setLoadingProjects(true);
    try {
      const projects = await jiraService.getProjects();
      setJiraProjects(projects);
    } catch (error) {
      console.error("Failed to load Jira projects:", error);
      setJiraProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadDefaultProject = async () => {
    try {
      const result = (await chrome.storage.local.get(
        "defaultJiraProject"
      )) as JiraSettingsStorage;
      if (result.defaultJiraProject) {
        setDefaultProject(result.defaultJiraProject);
      }
    } catch (error) {
      console.error("Failed to load default project:", error);
    }
  };

  const handleDefaultProjectChange = async (projectKey: string) => {
    setDefaultProject(projectKey);
    try {
      await chrome.storage.local.set({ defaultJiraProject: projectKey });
    } catch (error) {
      console.error("Failed to save default project:", error);
    }
  };

  const handleConnect = async () => {
    await jiraAuth.authenticate();
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect from Jira?")) {
      await jiraAuth.disconnect();
    }
  };

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
                  <Button variant="error" onClick={handleDisconnect}>
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

          {/* Future Settings Sections */}
          <SettingsCard
            title="Recording Settings"
            description="Recording preferences coming soon..."
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
