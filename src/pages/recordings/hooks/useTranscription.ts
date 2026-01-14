import { useState, useCallback, useEffect } from "react";
import { Recording, RecordingStorage } from "../../../types/recording";

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
        // Send message to background script to start transcription via offscreen + worker
        chrome.runtime.sendMessage({
          action: "transcribeVideoManual",
          recordingId: recording.id,
        });

        // Progress updates and completion will come through the message listener below
      } catch (error) {
        console.error("Transcription error:", error);
        alert("Transcription failed. Please try again.");
        setTranscriptionProgress("");
        setTranscribing(false);
      }
    },
    []
  );

  // Listen for transcription updates from background script
  useEffect(() => {
    const messageListener = (message: any) => {
      if (!selectedRecording) return;

      // Handle progress updates
      if (message.action === "transcriptionProgress") {
        if (message.recordingId === selectedRecording.id) {
          setTranscriptionProgress(`${message.status} (${message.progress}%)`);
        }
      }

      // Handle completion
      if (message.action === "transcriptionComplete") {
        if (message.recordingId === selectedRecording.id) {
          onRecordingUpdate({
            ...selectedRecording,
            transcript: message.transcript,
            transcribing: false,
          });
          setTranscriptionProgress("Transcription complete!");
          setTranscribing(false);
          setTimeout(() => setTranscriptionProgress(""), 3000);
        }
      }

      // Handle failure
      if (message.action === "transcriptionFailed") {
        if (message.recordingId === selectedRecording.id) {
          setTranscriptionProgress("");
          setTranscribing(false);
          alert(`Transcription failed: ${message.error}`);
        }
      }

      // Handle started
      if (message.action === "transcriptionStarted") {
        if (message.recordingId === selectedRecording.id) {
          setTranscribing(true);
          setTranscriptionProgress("Starting transcription...");
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [selectedRecording, onRecordingUpdate]);

  return {
    transcribing,
    transcriptionProgress,
    transcribeRecording,
  };
};
