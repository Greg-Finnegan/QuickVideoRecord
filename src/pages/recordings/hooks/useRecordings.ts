import { useState, useEffect, useCallback } from "react";
import { Recording, RecordingStorage } from "../../../types/recording";
import { videoStorage } from "../../../utils/videoStorage";

export const useRecordings = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecordings = useCallback(async () => {
    try {
      const result = (await chrome.storage.local.get(
        "recordings"
      )) as RecordingStorage;
      const savedRecordings: Recording[] = result.recordings || [];
      setRecordings(savedRecordings);
    } catch (error) {
      console.error("Failed to load recordings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRecording = useCallback(async (id: string) => {
    const updatedRecordings = await chrome.storage.local.get("recordings");
    const currentRecordings = (updatedRecordings.recordings || []) as Recording[];
    const filtered = currentRecordings.filter((r) => r.id !== id);

    await chrome.storage.local.set({ recordings: filtered });
    await videoStorage.deleteVideo(id);
    setRecordings(filtered);

    return id;
  }, []);

  const clearAllRecordings = useCallback(async () => {
    if (
      window.confirm("Are you sure you want to clear all recording history?")
    ) {
      await chrome.storage.local.set({ recordings: [] });
      await videoStorage.clearAll();
      setRecordings([]);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  // Listen for storage changes
  useEffect(() => {
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.recordings) {
        const newRecordings = changes.recordings.newValue as Recording[];
        if (newRecordings) {
          setRecordings(newRecordings);
        }
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, []);

  return {
    recordings,
    loading,
    setRecordings,
    deleteRecording,
    clearAllRecordings,
    loadRecordings,
  };
};
