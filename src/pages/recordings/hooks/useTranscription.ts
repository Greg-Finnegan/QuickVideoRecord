import { useState, useCallback, useEffect } from "react";
import { Recording, RecordingStorage } from "../../../types/recording";
import { videoStorage } from "../../../utils/videoStorage";
import { transcriptionService } from "../../../utils/transcription";

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
        const blob = await videoStorage.getVideo(recording.id);
        if (!blob) {
          alert("Video not found");
          return;
        }

        const transcript = await transcriptionService.transcribeVideo(
          blob,
          (status, progress) => {
            setTranscriptionProgress(`${status} (${progress}%)`);
          }
        );

        // Update recording with transcript
        const result = (await chrome.storage.local.get(
          "recordings"
        )) as RecordingStorage;
        const allRecordings: Recording[] = result.recordings || [];
        const updatedRecordings = allRecordings.map((r) =>
          r.id === recording.id ? { ...r, transcript } : r
        );

        await chrome.storage.local.set({ recordings: updatedRecordings });

        // Update selected recording
        if (selectedRecording?.id === recording.id) {
          onRecordingUpdate({ ...selectedRecording, transcript });
        }

        setTranscriptionProgress("Transcription complete!");
        setTimeout(() => setTranscriptionProgress(""), 3000);
      } catch (error) {
        console.error("Transcription error:", error);
        alert("Transcription failed. Please try again.");
        setTranscriptionProgress("");
      } finally {
        setTranscribing(false);
      }
    },
    [selectedRecording, onRecordingUpdate]
  );

  // Listen for transcription updates from background script
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.action === "transcriptionComplete" && selectedRecording) {
        if (message.recordingId === selectedRecording.id) {
          onRecordingUpdate({
            ...selectedRecording,
            transcript: message.transcript,
            transcribing: false,
          });
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
