import { jiraAuth } from "./jiraAuth";
import type { Version3Client } from "jira.js";
import type { Version3Models } from "jira.js";

class JiraService {
  private async getClient(): Promise<Version3Client | null> {
    return await jiraAuth.getClient();
  }

  /**
   * Get all projects accessible to the user
   */
  async getProjects(): Promise<Version3Models.Project[]> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const projects = await client.projects.searchProjects();
      return projects.values || [];
    } catch (error) {
      console.error("Failed to fetch Jira projects:", error);
      throw error;
    }
  }

  /**
   * Get issue types for a project
   */
  async getIssueTypes(
    projectKey: string
  ): Promise<Version3Models.IssueTypeDetails[]> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const project = await client.projects.getProject({
        projectIdOrKey: projectKey,
      });
      return project.issueTypes || [];
    } catch (error) {
      console.error("Failed to fetch issue types:", error);
      throw error;
    }
  }

  /**
   * Create a new Jira issue
   */
  async createIssue(params: {
    projectKey: string;
    summary: string;
    description?: string;
    issueTypeName?: string;
    priority?: string;
    labels?: string[];
  }): Promise<Version3Models.CreatedIssue> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const issueData: any = {
        fields: {
          project: {
            key: params.projectKey,
          },
          summary: params.summary,
          issuetype: {
            name: params.issueTypeName || "Task",
          },
        },
      };

      if (params.description) {
        issueData.fields.description = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: params.description,
                },
              ],
            },
          ],
        };
      }

      if (params.priority) {
        issueData.fields.priority = { name: params.priority };
      }

      if (params.labels && params.labels.length > 0) {
        issueData.fields.labels = params.labels;
      }

      const issue = await client.issues.createIssue(issueData);
      return issue;
    } catch (error) {
      console.error("Failed to create Jira issue:", error);
      throw error;
    }
  }

  /**
   * Add an attachment to a Jira issue
   */
  async addAttachment(
    issueKey: string,
    file: Blob,
    filename: string
  ): Promise<void> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const formData = new FormData();
      formData.append("file", file, filename);

      await client.issueAttachments.addAttachment({
        issueIdOrKey: issueKey,
        attachment: formData as any,
      });
    } catch (error) {
      console.error("Failed to add attachment to Jira issue:", error);
      throw error;
    }
  }

  /**
   * Get a specific issue by key
   */
  async getIssue(issueKey: string): Promise<Version3Models.Issue> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const issue = await client.issues.getIssue({ issueIdOrKey: issueKey });
      return issue;
    } catch (error) {
      console.error("Failed to fetch Jira issue:", error);
      throw error;
    }
  }

  /**
   * Add a comment to a Jira issue
   */
  async addComment(issueKey: string, comment: string): Promise<void> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      await client.issueComments.addComment({
        issueIdOrKey: issueKey,
        comment: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: comment,
                },
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error("Failed to add comment to Jira issue:", error);
      throw error;
    }
  }

  /**
   * Search for issues using JQL
   */
  async searchIssues(
    jql: string,
    maxResults: number = 50
  ): Promise<Version3Models.Issue[]> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const result = await client.issueSearch.searchForIssuesUsingJql({
        jql,
        maxResults,
      });
      return result.issues || [];
    } catch (error) {
      console.error("Failed to search Jira issues:", error);
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<Version3Models.User> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const user = await client.myself.getCurrentUser();
      return user;
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      throw error;
    }
  }
}

export const jiraService = new JiraService();
