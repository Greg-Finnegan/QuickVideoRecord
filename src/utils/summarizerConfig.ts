const TITLE_CONTEXT =
  "This is a video transcript. Generate a concise video title, max 10 words.";

export const SUMMARIZER_CREATE_OPTIONS = {
  type: "headline",
  format: "plain-text",
  length: "short",
  sharedContext: TITLE_CONTEXT,
} as const;

/**
 * Returns the Summarizer API object, checking both the global `Summarizer`
 * namespace (extension pages) and `ai.summarizer` (offscreen documents).
 * Returns null if neither is available.
 */
export function getSummarizerApi(): typeof Summarizer | null {
  if (typeof Summarizer !== "undefined") return Summarizer;
  // Offscreen documents expose the API via self.ai.summarizer instead of the global
  const global = self as any;
  if (global.ai?.summarizer) return global.ai.summarizer;
  return null;
}

/**
 * Summarize a transcript into a short title using the Summarizer API.
 * Returns the raw title string, or null if the API is unavailable.
 */
export async function generateTitle(transcript: string): Promise<string | null> {
  const api = getSummarizerApi();
  if (!api) return null;

  const summarizer = await api.create(SUMMARIZER_CREATE_OPTIONS);
  try {
    return await summarizer.summarize(transcript, { context: TITLE_CONTEXT });
  } finally {
    summarizer.destroy();
  }
}
