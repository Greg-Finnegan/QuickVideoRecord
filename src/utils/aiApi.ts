import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { AiApiConfig, AiTicketDraft } from "../types";

/** Max characters of transcript to send (bounds cost on long recordings). */
const MAX_TRANSCRIPT_LENGTH = 50_000;

const TIMEOUT_MS = 60_000;

/** Structured output every provider must return; the AI SDK enforces it. */
const ticketDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .describe("Short name for the dev ticket, max 10 words. Used as the filename and Jira summary."),
  description: z
    .string()
    .trim()
    .describe("The <200 word Jira ticket description, written per the instructions."),
});

export function getModel({ provider, apiKey, model }: Omit<AiApiConfig, "prompt">): LanguageModel {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "anthropic":
      return createAnthropic({
        apiKey,
        // Required for CORS from extension pages; the SDK doesn't add it
        headers: { "anthropic-dangerous-direct-browser-access": "true" },
      })(model);
    case "xai":
      return createOpenAI({ apiKey, baseURL: "https://api.x.ai/v1" }).chat(model);
    case "moonshot":
      return createOpenAI({ apiKey, baseURL: "https://api.moonshot.ai/v1" }).chat(model);
    case "gemini":
      return createGoogle({ apiKey })(model);
    case "openrouter":
      return createOpenRouter({ apiKey })(model);
  }
}

/** Throws NoObjectGeneratedError if the model's output doesn't match the schema. */
export async function draftFromModel(
  model: LanguageModel,
  prompt: string,
  transcript: string
): Promise<AiTicketDraft> {
  const { output } = await generateText({
    model,
    system: `${prompt}\n\noutput in markdown`,
    prompt: transcript.slice(0, MAX_TRANSCRIPT_LENGTH),
    output: Output.object({ schema: ticketDraftSchema }),
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    maxRetries: 1,
  });
  return output;
}

/**
 * Generate a ticket title + description from a transcript using the user's
 * configured provider, model and custom prompt.
 */
export function generateTicketDraft(config: AiApiConfig, transcript: string): Promise<AiTicketDraft> {
  return draftFromModel(getModel(config), config.prompt, transcript);
}
