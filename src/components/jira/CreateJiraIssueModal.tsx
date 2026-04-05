import React, { useEffect } from "react";
import Button from "../Button";
import Icon from "../Icon";
import IssueFormFields from "./IssueFormFields";
import { useCreateIssueForm } from "./hooks/useCreateIssueForm";
import type { Recording } from "../../types";

interface CreateJiraIssueModalProps {
  recording: Recording;
  onClose: () => void;
  onSuccess: (issueKey: string, issueUrl: string) => void;
  defaultProjectKey?: string;
}

const CreateJiraIssueModal: React.FC<CreateJiraIssueModalProps> = ({
  recording,
  onClose,
  onSuccess,
  defaultProjectKey,
}) => {
  const form = useCreateIssueForm(recording, defaultProjectKey);

  // Close protection: confirm before closing during upload
  const handleCloseAttempt = () => {
    if (!form.creating) {
      onClose();
      return;
    }
    const confirmed = confirm(
      "Upload is still in progress. Closing now may interrupt the process.\n\nAre you sure you want to close?"
    );
    if (confirmed) {
      onClose();
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }
        if (form.creating) {
          const confirmed = confirm(
            "Upload is still in progress. Closing now may interrupt the process.\n\nAre you sure you want to close?"
          );
          if (!confirmed) return;
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, form.creating]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await form.handleSubmit();
      if (result) {
        onSuccess(result.issueKey, result.issueUrl);
      }
    } catch (err) {
      console.error("Error creating issue:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onMouseDown={handleCloseAttempt}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Create Jira Issue
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
              {recording.filename}
            </p>
          </div>
          <Button
            variant="ghost"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            onClick={handleCloseAttempt}
          >
            <Icon name="close" size={24} />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto flex-1">
          <IssueFormFields form={form} />

          {/* Error Display */}
          {form.error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-800 dark:text-red-200">
                {form.error}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseAttempt}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                form.creating ||
                !form.projectKey ||
                !form.summary.trim() ||
                !form.issueTypeName
              }
            >
              {form.creating
                ? form.attachVideo
                  ? "Creating & Attaching..."
                  : "Creating..."
                : "Create Issue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJiraIssueModal;
