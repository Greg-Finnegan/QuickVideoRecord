/**
 * Form data for creating a Jira issue from a recording
 */
export interface CreateIssueFormData {
  recordingId: string;
  projectKey: string;
  summary: string;
  description?: string;
  issueTypeName: string;
  priority?: string;
  labels?: string[];
  attachVideo: boolean;
}

/**
 * Result of creating a Jira issue
 */
export interface CreateIssueResult {
  issueKey: string;
  issueUrl: string;
  attachmentFailed?: boolean;
}
