import { useState, useEffect, useCallback } from "react";
import { SUMMARIZER_CREATE_OPTIONS, getSummarizerApi } from "../../../utils/summarizerConfig";

export const useSummarizer = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [summarizerEnabled, setSummarizerEnabled] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const api = getSummarizerApi();
      if (!api) {
        setIsSupported(false);
        setLoading(false);
        return;
      }

      setIsSupported(true);

      try {
        const status = await api.availability();
        setAvailability(status);

        const result = await chrome.storage.local.get("summarizerEnabled");
        if (typeof result.summarizerEnabled === "boolean") {
          setSummarizerEnabled(result.summarizerEnabled);
        }
      } catch {
        setError("Failed to check Summarizer availability.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Listen for external storage changes
  useEffect(() => {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.summarizerEnabled) {
        const val = changes.summarizerEnabled.newValue;
        setSummarizerEnabled(typeof val === "boolean" ? val : false);
      }
    };

    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  const handleToggle = useCallback(async (enabled: boolean) => {
    setError(null);

    if (!enabled) {
      setSummarizerEnabled(false);
      await chrome.storage.local.set({ summarizerEnabled: false });
      return;
    }

    try {
      setDownloadProgress(0);
      const api = getSummarizerApi();
      if (!api) {
        setError("Summarizer API is no longer available.");
        return;
      }
      const summarizer = await api.create({
        ...SUMMARIZER_CREATE_OPTIONS,
        monitor(m: CreateMonitor) {
          m.addEventListener("downloadprogress", (e: ProgressEvent) => {
            setDownloadProgress(
              e.total > 0 ? Math.round((e.loaded / e.total) * 100) : null
            );
          });
        },
      });
      // Model is now cached; destroy the instance
      summarizer.destroy();
      setAvailability("available");
      setSummarizerEnabled(true);
      await chrome.storage.local.set({ summarizerEnabled: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download model.");
      setSummarizerEnabled(false);
      await chrome.storage.local.set({ summarizerEnabled: false });
    } finally {
      setDownloadProgress(null);
    }
  }, []);

  return {
    isSupported,
    availability,
    summarizerEnabled,
    downloadProgress,
    loading,
    error,
    handleToggle,
  };
};
