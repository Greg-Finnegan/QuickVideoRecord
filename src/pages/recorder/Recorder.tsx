import React, { useEffect, useRef, useState } from 'react';
import '../../index.css';
import Button from '../../components/Button';
import { Recording, RecordingStorage } from '../../types/recording';

const Recorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);

  useEffect(() => {
    console.log('Recorder component mounted');

    // Check if autostart parameter is present
    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart') === 'true';
    console.log('Autostart:', autostart);

    let timer: NodeJS.Timeout | null = null;

    if (autostart) {
      // Autostart immediately - the tab creation itself preserves the user gesture
      // But we need a tiny delay for React to finish rendering
      timer = setTimeout(() => {
        console.log('Auto-starting recording...');
        handleStartClick();
      }, 50);
    }

    // Listen for stop messages
    const messageListener = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log('Recorder received message:', message);

      if (message.action === 'stopRecording') {
        stopRecording();
        sendResponse({ success: true });
      }

      return true;
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      if (timer) clearTimeout(timer);
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleStartClick = () => {
    setShowStartButton(false);
    startRecording();
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording with getDisplayMedia...');
      setIsRecording(true);

      // Use getDisplayMedia - modern API that works without desktopCapture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        } as MediaTrackConstraints,
        audio: true, // Request system audio
      });

      console.log('Got display stream:', displayStream);
      console.log('Video tracks:', displayStream.getVideoTracks());
      console.log('Audio tracks:', displayStream.getAudioTracks());

      // Get microphone audio
      console.log('Requesting microphone access...');
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      console.log('Got microphone stream:', micStream);

      // Mix audio streams
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();

      // Add system audio if present
      const systemAudioTracks = displayStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        console.log('Mixing system audio with microphone');
        const systemSource = audioContext.createMediaStreamSource(
          new MediaStream(systemAudioTracks)
        );
        systemSource.connect(dest);
      } else {
        console.log('No system audio captured');
      }

      // Add microphone audio
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(dest);

      // Combine video with mixed audio
      const finalStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      console.log('Final stream created');
      finalStream.getTracks().forEach((track) => {
        console.log(`Track: ${track.kind}, label: ${track.label}`);
      });

      if (videoRef.current) {
        videoRef.current.srcObject = finalStream;
      }

      recordedChunksRef.current = [];

      // Check if the codec is supported
      const mimeType = 'video/webm;codecs=vp9,opus';
      let recorder: MediaRecorder;

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn('VP9 not supported, falling back to VP8');
        recorder = new MediaRecorder(finalStream, {
          mimeType: 'video/webm;codecs=vp8,opus',
        });
      } else {
        recorder = new MediaRecorder(finalStream, {
          mimeType: mimeType,
        });
      }

      console.log('MediaRecorder created with mimeType:', recorder.mimeType);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Data available:', event.data.size, 'bytes');
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        console.log('Recording stopped, total chunks:', recordedChunksRef.current.length);
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const filename = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;

        console.log('Sending download request...');
        chrome.runtime.sendMessage({
          action: 'downloadVideo',
          url: url,
          filename: filename,
        });

        // Save recording metadata
        try {
          const result = await chrome.storage.local.get('recordings') as RecordingStorage;
          const recordings: Recording[] = result.recordings || [];

          const newRecording: Recording = {
            id: Date.now().toString(),
            filename: filename,
            timestamp: Date.now(),
            size: blob.size,
          };

          recordings.unshift(newRecording);

          // Keep only last 50 recordings
          if (recordings.length > 50) {
            recordings.splice(50);
          }

          await chrome.storage.local.set({ recordings });
          console.log('Recording metadata saved');
        } catch (error) {
          console.error('Failed to save recording metadata:', error);
        }

        // Close tab after download
        setTimeout(() => chrome.tabs.getCurrent((tab) => tab && tab.id && chrome.tabs.remove(tab.id)), 1000);
      };

      recorder.start(1000); // Collect data every second
      console.log('MediaRecorder started!');

      mediaRecorderRef.current = recorder;

      // Send confirmation back to popup
      chrome.runtime.sendMessage({ action: 'recordingStarted' });
    } catch (err: any) {
      console.error('Recording failed - Full error:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);

      const errorMessage = `${err.name}: ${err.message}`;
      alert('Recording failed: ' + errorMessage);

      // Notify popup of error
      chrome.runtime.sendMessage({
        action: 'recordingError',
        error: errorMessage,
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="w-full h-screen bg-slate-900 dark:bg-black flex items-center justify-center relative">
      {showStartButton && (
        <div className="text-center text-white">
          <Button
            variant="primary"
            className="px-8 py-4 text-base rounded-lg shadow-[0_2px_8px_rgba(66,133,244,0.3)] active:scale-[0.98]"
            onClick={handleStartClick}
          >
            Click to Start Screen Recording
          </Button>
          <p className="mt-4 text-slate-400 dark:text-slate-500 text-sm">
            You'll be prompted to select which screen, window, or tab to record
          </p>
        </div>
      )}
      {isRecording && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center gap-6">
          <div className="bg-black/85 dark:bg-black/90 text-white px-8 py-4 rounded-xl flex items-center gap-3 text-base font-medium shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <span className="w-3 h-3 bg-red-600 dark:bg-red-500 rounded-full flex-shrink-0 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
            <span className="leading-none">Recording in progress...</span>
          </div>
          <Button
            variant="warning"
            className="px-10 py-4 text-base font-semibold rounded-lg shadow-[0_4px_12px_rgba(222,53,11,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(222,53,11,0.4)] active:translate-y-0"
            onClick={stopRecording}
          >
            <span className="text-lg leading-none">⏹</span>
            Stop & Download
          </Button>
          <p className="m-0 text-slate-400 dark:text-slate-500 text-[13px] max-w-[300px]">
            Recording will be saved as WebM file when you stop
          </p>
        </div>
      )}
      <video ref={videoRef} autoPlay muted className="hidden" />
    </div>
  );
};

export default Recorder;
