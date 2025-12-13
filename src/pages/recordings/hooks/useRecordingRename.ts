import { useState, useCallback } from "react";
import { Recording, RecordingStorage } from "../../../types/recording";

export const useRecordingRename = () => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newFilename, setNewFilename] = useState<string>("");

  const startRename = useCallback((recording: Recording) => {
    setRenamingId(recording.id);
    setNewFilename(recording.filename);
  }, []);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setNewFilename("");
  }, []);

  const renameRecording = useCallback(
    async (id: string): Promise<string | null> => {
      if (!newFilename.trim()) {
        alert("Please enter a valid filename");
        return null;
      }

      const result = (await chrome.storage.local.get(
        "recordings"
      )) as RecordingStorage;
      const allRecordings: Recording[] = result.recordings || [];
      const updatedRecordings = allRecordings.map((r) =>
        r.id === id ? { ...r, filename: newFilename.trim() } : r
      );

      await chrome.storage.local.set({ recordings: updatedRecordings });

      setRenamingId(null);
      setNewFilename("");

      return newFilename.trim();
    },
    [newFilename]
  );

  return {
    renamingId,
    newFilename,
    setNewFilename,
    startRename,
    cancelRename,
    renameRecording,
  };
};
