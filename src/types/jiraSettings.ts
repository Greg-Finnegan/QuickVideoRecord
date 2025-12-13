import type { Version3Models } from "jira.js";

/**
 * Jira OAuth tokens and authentication data
 */
export interface JiraTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  cloudId?: string;
  siteName?: string;
}

/**
 * Jira OAuth configuration
 */
export interface JiraOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
}

/**
 * Jira accessible resource information
 */
export interface JiraAccessibleResource {
  cloudId: string;
  siteName: string;
  url?: string;
  scopes?: string[];
}

/**
 * Default Jira project settings
 */
export interface JiraProjectSettings {
  defaultProjectKey: string;
  defaultProjectName?: string;
  defaultIssueType?: string;
  defaultPriority?: string;
  defaultLabels?: string[];
}

/**
 * Jira issue creation parameters
 */
export interface JiraIssueParams {
  projectKey: string;
  summary: string;
  description?: string;
  issueTypeName?: string;
  priority?: string;
  labels?: string[];
}

/**
 * Storage structure for Jira settings
 */
export interface JiraSettingsStorage {
  jiraTokens?: JiraTokens;
  defaultJiraProject?: string;
  defaultJiraSprint?: JiraSprint;
  jiraProjectSettings?: JiraProjectSettings;
}

/**
 * Dropdown option for Jira project selection
 */
export interface JiraProjectOption {
  value: string;
  label: string;
  description?: string;
  project?: Version3Models.Project;
}

/**
 * Jira integration status
 */
export interface JiraIntegrationStatus {
  isConnected: boolean;
  siteName?: string;
  cloudId?: string;
  user?: Version3Models.User;
  lastSync?: number;
}

/**
 * Jira Sprint information (from customfield_10020)
 */
export interface JiraSprint {
  id: number;
  name: string;
  state: "future" | "active" | "closed";
  boardId: number;
  goal?: string;
}

/**
 * Dropdown option for Jira sprint selection
 */
export interface JiraSprintOption {
  value: string;
  label: string;
  description?: string;
  sprint?: JiraSprint;
}
