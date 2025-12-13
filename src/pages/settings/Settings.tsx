import React, { useState, useEffect } from "react";
import "../../index.css";
import MainApplicationHeader from "../../components/MainApplicationHeader";
import Breadcrumb from "../../components/Breadcrumb";
import JiraProfile from "../../components/JiraProfile";
import Button from "../../components/Button";
import ThemeSlider from "../../components/ThemeSlider";
import { jiraAuth } from "../../utils/jiraAuth";
import { useTheme } from "../../hooks/useTheme";

const Settings: React.FC = () => {
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const { theme, setTheme, loading: themeLoading } = useTheme();

  useEffect(() => {
    checkJiraConnection();

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

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <MainApplicationHeader title="Settings" subtitle="Manage your preferences and integrations" />

      <div className="px-10 py-6 max-w-[1200px] mx-auto">
        <Breadcrumb
          items={[
            { label: "Recordings", path: "/" },
            { label: "Settings" },
          ]}
        />

        <div className="space-y-8">
          {/* Application Settings Section */}
          <section className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Application Settings
            </h2>

            <div className="space-y-6">
              {/* Theme Setting */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  Theme
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Choose your preferred color scheme. System will match your operating system settings.
                </p>
                {themeLoading ? (
                  <div className="h-11 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse w-80" />
                ) : (
                  <ThemeSlider value={theme} onChange={setTheme} />
                )}
              </div>
            </div>
          </section>

          {/* Jira Integration Section */}
          <section className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Jira Integration
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Connect your Jira account to create issues and attach recordings directly from this extension.
            </p>

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
              </div>
            ) : (
              <div className="space-y-4">
                <Button variant="primary" onClick={handleConnect}>
                  Connect with Jira
                </Button>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Connect your Jira account to enable issue creation and attachment features.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Future Settings Sections */}
          <section className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Recording Settings
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Recording preferences coming soon...
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
