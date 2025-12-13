import React from "react";
import JiraDropdown from "../../../components/jira/JiraDropdown";
import type { Version3Models } from "jira.js";

interface DefaultAssigneeSettingProps {
  users: Version3Models.User[];
  defaultAssignee: string;
  loadingUsers: boolean;
  onAssigneeChange: (accountId: string) => void;
}

/**
 * Setting component for selecting the default Jira ticket assignee
 */
const DefaultAssigneeSetting: React.FC<DefaultAssigneeSettingProps> = ({
  users,
  defaultAssignee,
  loadingUsers,
  onAssigneeChange,
}) => {
  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
        Default Assignee
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Select the default user to assign new tickets to.
      </p>
      <JiraDropdown
        options={users.map((user) => ({
          value: user.accountId || "",
          label: user.displayName || "Unknown User",
          description: user.emailAddress || "",
        }))}
        value={defaultAssignee}
        onChange={onAssigneeChange}
        placeholder="Select a user..."
        loading={loadingUsers}
      />
      {defaultAssignee && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected:{" "}
          {users.find((u) => u.accountId === defaultAssignee)?.displayName ||
            defaultAssignee}
        </p>
      )}
    </div>
  );
};

export default DefaultAssigneeSetting;
