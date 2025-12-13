import React from "react";
import JiraDropdown from "../../../components/jira/JiraDropdown";
import type { Version3Models } from "jira.js";

interface DefaultPrioritySettingProps {
  priorities: Version3Models.Priority[];
  defaultPriority: string;
  loadingPriorities: boolean;
  onPriorityChange: (priorityId: string) => void;
}

/**
 * Setting component for selecting the default Jira priority
 */
const DefaultPrioritySetting: React.FC<DefaultPrioritySettingProps> = ({
  priorities,
  defaultPriority,
  loadingPriorities,
  onPriorityChange,
}) => {
  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
        Default Priority
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Select the default priority level for new tickets.
      </p>
      <JiraDropdown
        options={priorities.map((priority) => ({
          value: priority.id || "",
          label: priority.name || "",
          description: priority.description || "",
        }))}
        value={defaultPriority}
        onChange={onPriorityChange}
        placeholder="Select a priority..."
        loading={loadingPriorities}
      />
      {defaultPriority && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected:{" "}
          {priorities.find((p) => p.id === defaultPriority)?.name ||
            defaultPriority}
        </p>
      )}
    </div>
  );
};

export default DefaultPrioritySetting;
