import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../Icon";
import { jiraService } from "../../utils/jiraService";
import { jiraAuth } from "../../utils/jiraAuth";
import type { Version3Models } from "jira.js";

interface JiraProfileProps {
  clickable?: boolean;
  showDisconnect?: boolean;
}

const JiraProfile: React.FC<JiraProfileProps> = ({
  clickable = true,
  showDisconnect = true
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<Version3Models.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await jiraService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error("Failed to load Jira user:", err);
      setError("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to disconnect from Jira?")) {
      await jiraAuth.disconnect();
      // The parent component will handle re-rendering after storage change
    }
  };

  const handleClick = () => {
    if (clickable) {
      navigate("/settings");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
      </div>
    );
  }

  if (error || !user) {
    return null; // Don't show anything if there's an error
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full hover:border-slate-400 dark:hover:border-slate-600 transition-all group ${
        clickable ? "cursor-pointer" : ""
      }`}
      title={clickable ? "Go to settings" : undefined}
    >
      {user.avatarUrls?.["48x48"] && (
        <img
          src={user.avatarUrls["48x48"]}
          alt={user.displayName || "User"}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className="flex items-center gap-2 min-w-0">
        <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
          {user.displayName || "Unknown User"}
        </div>
      </div>
      <img src="/jiraIcon2.png" alt="Jira" className="w-4 h-4" />
      {showDisconnect && (
        <button
          onClick={handleDisconnect}
          className="ml-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Disconnect from Jira"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
};

export default JiraProfile;
