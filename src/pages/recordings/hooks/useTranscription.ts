import { useState, useCallback, useEffect } from "react";
import { Recording, TranscriptionJobsStorage } from "../../../types";

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

  // Poll storage for transcription job updates (every 10 seconds)
  // This is the primary status tracking mechanism that survives service worker termination
  useEffect(() => {
    if (!selectedRecording?.id) return;

    let pollInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const pollTranscriptionStatus = async () => {
      if (!isMounted || !selectedRecording?.id) return;

      try {
        const result = (await chrome.storage.local.get('transcriptionJobs')) as TranscriptionJobsStorage;
        const jobs = result.transcriptionJobs || {};
        const job = jobs[selectedRecording.id];

        if (job) {
          // Update progress
          setTranscriptionProgress(`${job.statusMessage} (${job.progress}%)`);

          if (job.status === 'completed' && job.transcript) {
            // Update recording with transcript
            onRecordingUpdate({
              ...selectedRecording,
              transcript: job.transcript,
              transcribing: false,
            });
            setTranscribing(false);
            setTranscriptionProgress("Transcription complete!");
            setTimeout(() => {
              if (isMounted) setTranscriptionProgress("");
            }, 3000);

            // Stop polling after completion
            if (pollInterval) clearInterval(pollInterval);
          } else if (job.status === 'failed') {
            setTranscribing(false);
            setTranscriptionProgress("");
            alert(`Transcription failed: ${job.error}`);

            // Stop polling after failure
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('[useTranscription] Failed to poll transcription status:', error);
      }
    };

    // Start polling every 10 seconds
    pollInterval = setInterval(pollTranscriptionStatus, 10000);

    // Also poll immediately on mount/recording change
    pollTranscriptionStatus();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [selectedRecording?.id, onRecordingUpdate]);

  // Listen for storage changes for real-time updates (when service worker is alive)
  // This provides immediate updates instead of waiting for next poll
  useEffect(() => {
    if (!selectedRecording?.id) return;

    const storageListener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'local' || !changes.transcriptionJobs) return;
      if (!selectedRecording?.id) return;

      const newJobs = changes.transcriptionJobs.newValue || {};
      const job = newJobs[selectedRecording.id];

      if (job) {
        // Update progress immediately
        setTranscriptionProgress(`${job.statusMessage} (${job.progress}%)`);

        if (job.status === 'completed' && job.transcript) {
          onRecordingUpdate({
            ...selectedRecording,
            transcript: job.transcript,
            transcribing: false,
          });
          setTranscribing(false);
          setTranscriptionProgress("Transcription complete!");
          setTimeout(() => setTranscriptionProgress(""), 3000);
        } else if (job.status === 'failed') {
          setTranscribing(false);
          setTranscriptionProgress("");
          alert(`Transcription failed: ${job.error}`);
        }
      }
    };

    chrome.storage.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, [selectedRecording?.id, onRecordingUpdate]);

  // Listen for transcription updates from background script (fallback for real-time updates)
  // This is a "best effort" mechanism when service worker is alive
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
