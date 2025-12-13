import React from "react";
import JiraDropdown from "../../../components/jira/JiraDropdown";
import type { JiraSprintOption, JiraSprint } from "../../../types";

interface DefaultSprintSettingProps {
  sprints: JiraSprint[];
  defaultSprint: JiraSprint | null;
  loadingSprints: boolean;
  onSprintChange: (sprint: JiraSprint | null) => void;
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

  const handleSprintChange = (sprintId: string) => {
    if (!sprintId) {
      onSprintChange(null);
      return;
    }
    const selectedSprint = sprints.find((s) => s.id.toString() === sprintId);
    onSprintChange(selectedSprint || null);
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
        Default Sprint
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Select the default Jira sprint for tickets created by this extension. <br></br>
        Jira makes getting sprints harder than it should be. This could take some time or not work at all.
      </p>
      <ul className="text-sm text-slate-600 dark:text-slate-400 mb-4 list-disc pl-5">
        <li>🟢 Active</li>
        <li>🔵 Future</li>
        <li>⚪ Closed</li>
      </ul>
      <JiraDropdown
        options={[
          { value: "", label: "No Sprint", description: "Not assigned to a sprint" },
          ...sprints.map(
            (sprint): JiraSprintOption => ({
              value: sprint.id.toString(),
              label: `${getSprintStateLabel(sprint.state)} ${sprint.name}`,
              description: sprint.goal || `Sprint ID: ${sprint.id}`,
              sprint: sprint,
            })
          ),
        ]}
        value={defaultSprint?.id.toString() || ""}
        onChange={handleSprintChange}
        placeholder="Select a sprint..."
        loading={loadingSprints}
      />
      {defaultSprint && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected: {defaultSprint.name}
        </p>
      )}
    </div>
  );
};

export default DefaultSprintSetting;
