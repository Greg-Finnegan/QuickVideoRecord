import { useState } from "react";
import { geminiService } from "../../../utils/geminiService";
import type { GenerateDescriptionParams } from "../../../types";

/**
 * Hook for generating AI content using Gemini
 */
export const useGeminiGeneration = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate a Jira issue description
   */
  const generateDescription = async (
    params: GenerateDescriptionParams
  ): Promise<string> => {
    setGenerating(true);
    setError(null);

    try {
      const description = await geminiService.generateIssueDescription(params);
      setGenerating(false);
      return description;
    } catch (err) {
      console.error("Failed to generate description:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate description. Please try again.";
      setError(errorMessage);
      setGenerating(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Generate a recording summary/title
   */
  const generateSummary = async (
    params: GenerateDescriptionParams
  ): Promise<string> => {
    setGenerating(true);
    setError(null);

    try {
      const summary = await geminiService.generateRecordingSummary(params);
      setGenerating(false);
      return summary;
    } catch (err) {
      console.error("Failed to generate summary:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to generate summary. Please try again.";
      setError(errorMessage);
      setGenerating(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Reset error state
   */
  const reset = () => {
    setError(null);
    setGenerating(false);
  };

  return {
    generating,
    error,
    generateDescription,
    generateSummary,
    reset,
  };
};
