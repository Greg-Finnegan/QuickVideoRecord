import { jiraAuth } from "./jiraAuth";
import type { Version3Client } from "jira.js";
import type { Version3Models } from "jira.js";

// ── ADF helpers ──────────────────────────────────────────────────────────────

interface AdfMark {
  type: "strong" | "em";
}

interface AdfTextNode {
  type: "text";
  text: string;
  marks?: AdfMark[];
}

interface AdfNode {
  type: string;
  content?: AdfNode[];
  text?: string;
  marks?: AdfMark[];
  attrs?: Record<string, unknown>;
}

interface AdfDocument {
  type: "doc";
  version: 1;
  content: AdfNode[];
}

/** Parse inline **bold** and *italic* markers into ADF text nodes. */
function parseInlineMarks(text: string): AdfTextNode[] {
  const nodes: AdfTextNode[] = [];
  // Regex matches **bold** / __bold__ and *italic* / _italic_
  const pattern = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      // Bold
      nodes.push({ type: "text", text: match[2], marks: [{ type: "strong" }] });
    } else if (match[4]) {
      // Italic
      nodes.push({ type: "text", text: match[4], marks: [{ type: "em" }] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  // If nothing was parsed, return a single text node
  if (nodes.length === 0) {
    nodes.push({ type: "text", text });
  }

  return nodes;
}

/** Build a paragraph node from a line of text. */
function paragraphNode(text: string): AdfNode {
  return { type: "paragraph", content: parseInlineMarks(text) };
}

/** Convert plain text (with basic markdown) to a Jira ADF document. */
function textToAdf(text: string): AdfDocument {
  const content: AdfNode[] = [];

  // Split on blank lines to get blocks
  const blocks = text.split(/\n{2,}/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");

    // Check if the block is a bullet list (all lines start with - or * )
    const isBulletList = lines.every((l) => /^\s*[-*]\s/.test(l));
    if (isBulletList) {
      content.push({
        type: "bulletList",
        content: lines.map((line) => ({
          type: "listItem",
          content: [paragraphNode(line.replace(/^\s*[-*]\s+/, ""))],
        })),
      });
      continue;
    }

    // Check if the block is an ordered list (all lines start with digits.)
    const isOrderedList = lines.every((l) => /^\s*\d+\.\s/.test(l));
    if (isOrderedList) {
      content.push({
        type: "orderedList",
        content: lines.map((line) => ({
          type: "listItem",
          content: [paragraphNode(line.replace(/^\s*\d+\.\s+/, ""))],
        })),
      });
      continue;
    }

    // Process individual lines
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Horizontal rule
      if (/^[-*_]{3,}$/.test(trimmedLine)) {
        content.push({ type: "rule" });
        continue;
      }

      // Heading (# - ###)
      const headingMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        content.push({
          type: "heading",
          attrs: { level: headingMatch[1].length },
          content: parseInlineMarks(headingMatch[2]),
        });
        continue;
      }

      // Regular paragraph
      content.push(paragraphNode(trimmedLine));
    }
  }

  // ADF requires at least one content node
  if (content.length === 0) {
    content.push(paragraphNode(text || " "));
  }

  return { type: "doc", version: 1, content };
}

// ── Jira Service ─────────────────────────────────────────────────────────────

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
    assigneeId?: string;
    sprintId?: string;
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
        issueData.fields.description = textToAdf(params.description);
      }

      if (params.priority) {
        issueData.fields.priority = { id: params.priority };
      }

      if (params.assigneeId) {
        issueData.fields.assignee = { accountId: params.assigneeId };
      }

      if (params.sprintId) {
        // Sprint is stored in customfield_10020 (Jira's default sprint field)
        issueData.fields.customfield_10020 = parseInt(params.sprintId, 10);
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
   * Accepts File or Blob objects - File objects with proper MIME type are recommended
   */
  async addAttachment(
    issueKey: string,
    file: File | Blob,
    filename: string
  ): Promise<void> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      // jira.js expects an attachment object with file and filename properties
      // The library will handle creating the FormData internally
      await client.issueAttachments.addAttachment({
        issueIdOrKey: issueKey,
        attachment: {
          file: file,
          filename: filename,
        },
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
        comment: textToAdf(comment),
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
      const result = await client.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
        jql,
        maxResults,
        fields: ["*all"],
        expand: "renderedFields,names,schema,transitions,operations,editmeta,changelog",
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
  /**
   * Get all priorities
   */
  async getPriorities(): Promise<Version3Models.Priority[]> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const priorities = await client.issuePriorities.getPriorities();
      return priorities || [];
    } catch (error) {
      console.error("Failed to fetch priorities:", error);
      return [];
    }
  }

  /**
   * Get users who can be assigned to issues in a project
   */
  async getProjectUsers(projectKey: string): Promise<Version3Models.User[]> {
    const client = await this.getClient();
    if (!client) {
      throw new Error("Not authenticated with Jira");
    }

    try {
      const users = await client.userSearch.findAssignableUsers({
        project: projectKey,
      });
      return users || [];
    } catch (error) {
      console.error("Failed to fetch project users:", error);
      return [];
    }
  }
}

export const jiraService = new JiraService();
