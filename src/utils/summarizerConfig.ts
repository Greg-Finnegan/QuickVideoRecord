const TITLE_CONTEXT =
  "This is a video transcript. Generate a concise video title, max 10 words.";

export const SUMMARIZER_CREATE_OPTIONS = {
  type: "headline",
  format: "plain-text",
  length: "short",
  sharedContext: TITLE_CONTEXT,
} as const;

/** Max characters of transcript to send to the Summarizer API. */
const MAX_TRANSCRIPT_LENGTH = 3000;

/** Timeout (ms) for the summarizer create + summarize pipeline. */
const SUMMARIZE_TIMEOUT_MS = 30_000;

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
 * Returns the raw title string, or null if the API is unavailable or times out.
 */
export async function generateTitle(transcript: string): Promise<string | null> {
  const api = getSummarizerApi();
  if (!api) return null;

  const input = transcript.length > MAX_TRANSCRIPT_LENGTH
    ? transcript.slice(0, MAX_TRANSCRIPT_LENGTH)
    : transcript;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Summarizer timed out")), SUMMARIZE_TIMEOUT_MS)
  );

  const summarize = async () => {
    const summarizer = await api.create(SUMMARIZER_CREATE_OPTIONS);
    try {
      return await summarizer.summarize(input, { context: TITLE_CONTEXT });
    } finally {
      summarizer.destroy();
    }
  };

  return Promise.race([summarize(), timeout]);
}
