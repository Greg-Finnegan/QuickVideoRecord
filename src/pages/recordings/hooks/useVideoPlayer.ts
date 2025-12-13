import { useState, useCallback } from "react";
import { Recording } from "../../../types/recording";
import { videoStorage } from "../../../utils/videoStorage";

export const useVideoPlayer = () => {
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const playRecording = useCallback(async (recording: Recording) => {
    try {
      const blob = await videoStorage.getVideo(recording.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setSelectedRecording(recording);
      } else {
        alert(
          "Video not found. It may have been deleted or not saved properly."
        );
      }
    } catch (error) {
      console.error("Failed to load video:", error);
      alert("Failed to load video");
    }
  }, []);

  const closePlayer = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setSelectedRecording(null);
  }, [videoUrl]);

  const updateSelectedRecording = useCallback((recording: Recording) => {
    setSelectedRecording(recording);
  }, []);

  return {
    selectedRecording,
    videoUrl,
    playRecording,
    closePlayer,
    updateSelectedRecording,
  };
};
