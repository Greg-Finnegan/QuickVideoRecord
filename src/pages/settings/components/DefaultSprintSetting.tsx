import React from "react";
import JiraDropdown from "../../../components/jira/JiraDropdown";
import type { JiraSprintOption, JiraSprint } from "../../../types";

interface DefaultSprintSettingProps {
  sprints: JiraSprint[];
  defaultSprint: string;
  loadingSprints: boolean;
  onSprintChange: (sprintId: string) => void;
}

/**
 * Setting component for selecting the default Jira sprint
 */
const DefaultSprintSetting: React.FC<DefaultSprintSettingProps> = ({
  sprints,
  defaultSprint,
  loadingSprints,
  onSprintChange,
}) => {
  const getSprintStateLabel = (state: string) => {
    switch (state) {
      case "active":
        return "🟢";
      case "future":
        return "🔵";
      case "closed":
        return "⚪";
      default:
        return "";
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
        Default Sprint
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Select the default Jira sprint for tickets created by this extension.
      </p>
      <JiraDropdown
        options={sprints.map(
          (sprint): JiraSprintOption => ({
            value: sprint.id.toString(),
            label: `${getSprintStateLabel(sprint.state)} ${sprint.name}`,
            description: sprint.goal || `Sprint ID: ${sprint.id}`,
            sprint: sprint,
          })
        )}
        value={defaultSprint}
        onChange={onSprintChange}
        placeholder="Select a sprint..."
        loading={loadingSprints}
      />
      {defaultSprint && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected:{" "}
          {sprints.find((s) => s.id.toString() === defaultSprint)?.name ||
            defaultSprint}
        </p>
      )}
    </div>
  );
};

export default DefaultSprintSetting;
