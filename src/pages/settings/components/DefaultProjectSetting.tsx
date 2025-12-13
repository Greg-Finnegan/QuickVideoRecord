import React from "react";
import JiraDropdown from "../../../components/jira/JiraDropdown";
import type { JiraProjectOption } from "../../../types";
import type { Version3Models } from "jira.js";

interface DefaultProjectSettingProps {
  jiraProjects: Version3Models.Project[];
  defaultProject: string;
  loadingProjects: boolean;
  onProjectChange: (projectKey: string) => void;
}

/**
 * Setting component for selecting the default Jira project
 */
const DefaultProjectSetting: React.FC<DefaultProjectSettingProps> = ({
  jiraProjects,
  defaultProject,
  loadingProjects,
  onProjectChange,
}) => {
  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
        Default Project
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Select the default Jira project for tickets created by this extension.
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
        onChange={onProjectChange}
        placeholder="Select a project..."
        loading={loadingProjects}
      />
      {defaultProject && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected:{" "}
          {jiraProjects.find((p) => p.key === defaultProject)?.name ||
            defaultProject}
        </p>
      )}
    </div>
  );
};

export default DefaultProjectSetting;
