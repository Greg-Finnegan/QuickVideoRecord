import { geminiAuth } from "./geminiAuth";
import type {
  GeminiGenerateRequest,
  GeminiGenerateResponse,
  GenerateDescriptionParams,
} from "../types";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-1.5-flash";

class GeminiService {
  /**
   * Get a valid access token
   */
  private async getAccessToken(): Promise<string | null> {
    return await geminiAuth.getAccessToken();
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<string> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error("Not authenticated with Gemini");
    }

    const model = options?.model || DEFAULT_MODEL;
    const url = `${GEMINI_API_BASE}/models/${model}:generateContent`;

    const request: GeminiGenerateRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 1000,
      },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API error:", response.status, errorText);

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Authentication failed. Please reconnect to Gemini.");
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else if (response.status === 403) {
          throw new Error("Access denied. Please check your API permissions.");
        }

        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data: GeminiGenerateResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No content generated");
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      return generatedText;
    } catch (error) {
      console.error("Failed to generate content:", error);
      throw error;
    }
  }

  /**
   * Generate a Jira issue description from recording data
   */
  async generateIssueDescription(
    params: GenerateDescriptionParams
  ): Promise<string> {
    const { recordingTitle, transcript, additionalContext } = params;

    // Build context-aware prompt
    let prompt = `You are helping create a Jira issue description for a screen recording.\n\n`;
    prompt += `Recording Title: ${recordingTitle}\n\n`;

    if (transcript) {
      // Limit transcript length to avoid token limits (approximately 2000 chars)
      const truncatedTranscript =
        transcript.length > 2000
          ? transcript.substring(0, 2000) + "..."
          : transcript;
      prompt += `Transcript of the recording:\n${truncatedTranscript}\n\n`;
    }

    if (additionalContext) {
      prompt += `Additional Context: ${additionalContext}\n\n`;
    }

    prompt += `Based on this information, generate a clear and concise Jira issue description that:\n`;
    prompt += `1. Summarizes the key points from the recording\n`;
    prompt += `2. Identifies any bugs, issues, or feature requests mentioned\n`;
    prompt += `3. Provides actionable steps if applicable\n`;
    prompt += `4. Uses professional language suitable for a development team\n`;
    prompt += `5. Keeps the description under 500 words\n\n`;
    prompt += `Generate the description now:`;

    return await this.generateContent(prompt, {
      temperature: 0.5, // Lower temperature for more consistent output
      maxOutputTokens: 800,
    });
  }

  /**
   * Generate a summary/title for a recording
   */
  async generateRecordingSummary(
    params: GenerateDescriptionParams
  ): Promise<string> {
    const { recordingTitle, transcript } = params;

    let prompt = `Generate a brief, descriptive title for this screen recording.\n\n`;

    if (transcript) {
      // Limit transcript length
      const truncatedTranscript =
        transcript.length > 1000
          ? transcript.substring(0, 1000) + "..."
          : transcript;
      prompt += `Transcript: ${truncatedTranscript}\n\n`;
    } else {
      prompt += `Original Title: ${recordingTitle}\n\n`;
    }

    prompt += `Generate a concise, descriptive title (5-10 words) that captures the main topic:`;

    return await this.generateContent(prompt, {
      temperature: 0.3,
      maxOutputTokens: 50,
    });
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generateContent("Test connection. Respond with 'OK'.", {
        maxOutputTokens: 10,
      });
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
