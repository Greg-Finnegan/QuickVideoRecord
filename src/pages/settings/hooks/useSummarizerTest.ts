import { useState, useEffect, useCallback } from "react";

export const useSummarizerTest = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      if (!("Summarizer" in self)) {
        setIsSupported(false);
        return;
      }

      setIsSupported(true);

      try {
        const status = await Summarizer.availability();
        setAvailability(status);
      } catch (err) {
        setError("Failed to check Summarizer availability.");
      }
    };

    checkSupport();
  }, []);

  const summarize = useCallback(async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setSummary("");

    try {
      const summarizer = await Summarizer.create({
        type: "headline",
        format: "plain-text",
        length: "short",
        sharedContext:
          "Generate a concise video title. Maximum 10 words, prefer shorter if it makes sense.",
        monitor(m: CreateMonitor) {
          m.addEventListener("downloadprogress", (e: ProgressEvent) => {
            setDownloadProgress(Math.round((e.loaded / e.total) * 100));
          });
        },
      });

      const result = await summarizer.summarize(inputText, {
        context:
          "This is a video transcript. Create a short video title, max 10 words.",
      });
      setSummary(result);
      summarizer.destroy();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summarization failed.");
    } finally {
      setLoading(false);
      setDownloadProgress(null);
    }
  }, [inputText]);

  return {
    isSupported,
    availability,
    downloadProgress,
    inputText,
    setInputText,
    summary,
    loading,
    error,
    summarize,
  };
};
