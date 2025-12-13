import { useEffect } from "react";
import { Recording } from "../../../types/recording";

interface UseRecordingTranscriptionUpdatesProps {
  setRecordings: React.Dispatch<React.SetStateAction<Recording[]>>;
}

export const useRecordingTranscriptionUpdates = ({
  setRecordings,
}: UseRecordingTranscriptionUpdatesProps) => {
  useEffect(() => {
    const messageListener = (message: any) => {
      if (message.action === "transcriptionStarted") {
        setRecordings((prevRecordings) =>
          prevRecordings.map((r) =>
            r.id === message.recordingId ? { ...r, transcribing: true } : r
          )
        );
      } else if (message.action === "transcriptionComplete") {
        setRecordings((prevRecordings) =>
          prevRecordings.map((r) =>
            r.id === message.recordingId
              ? { ...r, transcript: message.transcript, transcribing: false }
              : r
          )
        );
      } else if (message.action === "transcriptionFailed") {
        setRecordings((prevRecordings) =>
          prevRecordings.map((r) =>
            r.id === message.recordingId ? { ...r, transcribing: false } : r
          )
        );
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [setRecordings]);
};
