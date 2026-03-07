import { useState, useCallback, useEffect } from "react";
import type { Recording } from "../../../types";

interface UseTranscriptionProps {
  selectedRecording: Recording | null;
  onRecordingUpdate: (recording: Recording) => void;
}

export const useTranscription = ({
  selectedRecording,
  onRecordingUpdate,
}: UseTranscriptionProps) => {
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<string>("");

  const transcribeRecording = useCallback(
    async (recording: Recording) => {
      if (!recording.id) return;

      setTranscribing(true);
      setTranscriptionProgress("Starting transcription...");

      try {
        chrome.runtime.sendMessage({
          action: "transcribeVideoManual",
          recordingId: recording.id,
        });
      } catch (error) {
        console.error("Transcription error:", error);
        alert("Transcription failed. Please try again.");
        setTranscriptionProgress("");
        setTranscribing(false);
      }
    },
    []
  );

  // Watch the recording in storage for transcript/transcribing changes.
  // The offscreen document writes directly to the recording, so this is the
  // primary and most reliable way to detect completion.
  useEffect(() => {
    if (!selectedRecording?.id) return;

    const storageListener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== "local" || !changes.recordings) return;

      const newRecordings = (changes.recordings.newValue || []) as Recording[];
      const updated = newRecordings.find((r) => r.id === selectedRecording.id);
      if (!updated) return;

      // Transcript appeared — transcription completed
      if (updated.transcript && !selectedRecording.transcript) {
        onRecordingUpdate(updated);
        setTranscribing(false);
        setTranscriptionProgress("Transcription complete!");
        setTimeout(() => setTranscriptionProgress(""), 3000);
      }

      // Transcribing was cleared without a transcript — failure
      if (!updated.transcribing && selectedRecording.transcribing && !updated.transcript) {
        onRecordingUpdate(updated);
        setTranscribing(false);
        setTranscriptionProgress("");
      }
    };

    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, [selectedRecording, onRecordingUpdate]);

  // Listen for real-time progress messages from offscreen (best-effort)
  useEffect(() => {
    const messageListener = (message: any) => {
      if (!selectedRecording) return;

      if (message.action === "transcriptionProgress" && message.recordingId === selectedRecording.id) {
        setTranscriptionProgress(`${message.status} (${message.progress}%)`);
      }

      if (message.action === "transcriptionComplete" && message.recordingId === selectedRecording.id) {
        onRecordingUpdate({
          ...selectedRecording,
          transcript: message.transcript,
          transcribing: false,
        });
        setTranscriptionProgress("Transcription complete!");
        setTranscribing(false);
        setTimeout(() => setTranscriptionProgress(""), 3000);
      }

      if (message.action === "transcriptionFailed" && message.recordingId === selectedRecording.id) {
        setTranscriptionProgress("");
        setTranscribing(false);
        alert(`Transcription failed: ${message.error}`);
      }

      if (message.action === "transcriptionStarted" && message.recordingId === selectedRecording.id) {
        setTranscribing(true);
        setTranscriptionProgress("Starting transcription...");
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, [selectedRecording, onRecordingUpdate]);

  return {
    transcribing,
    transcriptionProgress,
    transcribeRecording,
  };
};
