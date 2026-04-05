import React from "react";
import JiraDropdown from "./JiraDropdown";
import MarkdownEditor from "../MarkdownEditor";
import { parseLabels } from "../../utils/jiraHelpers";
import type { useCreateIssueForm } from "./hooks/useCreateIssueForm";

type FormState = ReturnType<typeof useCreateIssueForm>;

interface IssueFormFieldsProps {
  form: FormState;
}

const IssueFormFields: React.FC<IssueFormFieldsProps> = ({ form }) => {
  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Project <span className="text-red-500">*</span>
        </label>
        <JiraDropdown
          options={form.projectOptions}
          value={form.projectKey}
          onChange={form.setProjectKey}
          placeholder="Select a project"
          loading={form.loadingProjects}
          disabled={form.creating}
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Select the Jira project for this issue
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Issue Type <span className="text-red-500">*</span>
        </label>
        <JiraDropdown
          options={form.issueTypeOptions}
          value={form.issueTypeName}
          onChange={form.setIssueTypeName}
          placeholder="Select issue type"
          loading={form.loadingIssueTypes}
          disabled={form.creating || !form.projectKey}
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Type of issue (e.g., Bug, Task, Story)
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.summary}
          onChange={(e) => form.setSummary(e.target.value)}
          placeholder="Brief description of the issue"
          maxLength={255}
          disabled={form.creating}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          required
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          {form.summary.length}/255 characters
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Description
        </label>
        <MarkdownEditor
          value={form.description}
          onChange={form.setDescription}
          disabled={form.creating}
          rows={6}
          placeholder="Detailed description — supports **bold**, *italic*, # headings, and lists"
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Supports markdown: **bold**, *italic*, # headings, - lists
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Priority
        </label>
        <JiraDropdown
          options={form.priorityOptions}
          value={form.priority}
          onChange={form.setPriority}
          placeholder="Select priority (optional)"
          disabled={form.creating}
          loading={form.loadingPriorities}
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Issue priority (optional)
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Assignee
        </label>
        <JiraDropdown
          options={form.assigneeOptions}
          value={form.assigneeId}
          onChange={form.setAssigneeId}
          placeholder="Select assignee (optional)"
          disabled={form.creating || !form.projectKey}
          loading={form.loadingUsers}
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          User to assign this issue to (optional)
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Sprint
        </label>
        <JiraDropdown
          options={form.sprintOptions}
          value={form.sprintId}
          onChange={form.setSprintId}
          placeholder="Select sprint (optional)"
          disabled={form.creating}
          loading={form.loadingSprints}
          onOpen={form.loadSprints}
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Sprint to assign this issue to (optional)
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Labels
        </label>
        <input
          type="text"
          value={form.labelsInput}
          onChange={(e) => form.setLabelsInput(e.target.value)}
          placeholder="bug, enhancement, urgent"
          disabled={form.creating}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Comma-separated labels
        </p>
        {form.labelsInput && (
          <div className="flex flex-wrap gap-2 mt-2">
            {parseLabels(form.labelsInput).map((label, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.attachVideo}
            onChange={(e) => form.setAttachVideo(e.target.checked)}
            disabled={form.creating}
            className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-blue-500 disabled:opacity-50"
          />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Attach video recording to issue
          </span>
        </label>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 ml-6">
          Video will be uploaded as an attachment
        </p>
      </div>
    </>
  );
};

export default IssueFormFields;
