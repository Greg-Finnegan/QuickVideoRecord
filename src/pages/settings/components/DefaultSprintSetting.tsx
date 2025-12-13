import React from "react";
import JiraDropdown from "../../../components/jira/JiraDropdown";

interface Sprint {
  id: number;
  name: string;
  state: string;
}

interface DefaultSprintSettingProps {
  sprints: Sprint[];
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
  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
        Default Sprint
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Select the default sprint for new tickets. Only active sprints are shown.
      </p>
      <JiraDropdown
        options={sprints.map((sprint) => ({
          value: String(sprint.id),
          label: sprint.name,
          description: `State: ${sprint.state}`,
        }))}
        value={defaultSprint}
        onChange={onSprintChange}
        placeholder="Select a sprint..."
        loading={loadingSprints}
      />
      {defaultSprint && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected:{" "}
          {sprints.find((s) => String(s.id) === defaultSprint)?.name ||
            defaultSprint}
        </p>
      )}
    </div>
  );
};

export default DefaultSprintSetting;
