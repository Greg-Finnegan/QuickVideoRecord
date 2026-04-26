import React from "react";
import JiraDropdown from "../../../components/jira/JiraDropdown";
import type { Version3Models } from "jira.js";

interface DefaultIssueTypeSettingProps {
  issueTypes: Version3Models.IssueTypeDetails[];
  defaultIssueType: string;
  loadingIssueTypes: boolean;
  onIssueTypeChange: (issueTypeName: string) => void;
}

/**
 * Setting component for selecting the default Jira issue type
 */
const DefaultIssueTypeSetting: React.FC<DefaultIssueTypeSettingProps> = ({
  issueTypes,
  defaultIssueType,
  loadingIssueTypes,
  onIssueTypeChange,
}) => {
  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
        Default Issue Type
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Select the default issue type for new tickets. Requires a default project
        to be set.
      </p>
      <JiraDropdown
        options={issueTypes.map((type) => ({
          value: type.name || "",
          label: type.name || "",
          description: type.description || "",
        }))}
        value={defaultIssueType}
        onChange={onIssueTypeChange}
        placeholder="Select an issue type..."
        loading={loadingIssueTypes}
        disabled={issueTypes.length === 0}
      />
      {defaultIssueType && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected: {defaultIssueType}
        </p>
      )}
    </div>
  );
};

export default DefaultIssueTypeSetting;
