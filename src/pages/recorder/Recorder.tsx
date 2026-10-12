import React, { useEffect, useRef, useState } from 'react';
import fixWebmDuration from 'fix-webm-duration';
import '../../index.css';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import AudioVisualizer from '../../components/AudioVisualizer';
import { useStreamAudioLevels } from '../../hooks/useStreamAudioLevels';
import { Recording, RecordingStorage } from '../../types/recording';
import type { ExtensionSettingsStorage } from '../../types';
import { videoStorage } from '../../utils/videoStorage';
import { RecordingTimer } from '../../utils/recordingTimer';

const Recorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef(new RecordingTimer());
  // Audio mixer kept around so the mic can be swapped mid-recording
  const mixerRef = useRef<{
    ctx: AudioContext;
    dest: MediaStreamAudioDestinationNode;
    micSource: MediaStreamAudioSourceNode | null;
    micStream: MediaStream | null;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Tap the recorded audio locally and broadcast levels to the side panel.
  const audioLevels = useStreamAudioLevels(audioStream, { broadcast: true });

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
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log('Recorder received message:', message);

      // Every branch below responds synchronously, so the listener must not
      // return true — doing so would claim an async response that never
      // arrives and leave the message channel dangling (e.g. for broadcasts
      // this listener ignores, such as `closeSidePanel`).
      if (message.action === 'stopRecording') {
        stopRecording();
        sendResponse({ success: true });
      } else if (message.action === 'pauseRecording') {
        pauseRecording();
        sendResponse({ success: true });
      } else if (message.action === 'resumeRecording') {
        resumeRecording();
        sendResponse({ success: true });
      }

      return false;
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Mic picked in the side panel while recording
    const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const next = changes.micDeviceId?.newValue;
      if (typeof next === 'string') void switchMic(next);
    };
    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      if (timer) clearTimeout(timer);
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, []);

  const getMic = async (deviceId: string | undefined, exact = false): Promise<MediaStream | null> => {
    const audio =
      deviceId && deviceId !== 'default'
        ? { deviceId: exact ? { exact: deviceId } : { ideal: deviceId } }
        : true;
    try {
      return await navigator.mediaDevices.getUserMedia({ audio, video: false });
    } catch (err) {
      console.warn('Microphone not available:', err);
      return null;
    }
  };

  const switchMic = async (deviceId: string) => {
    const mixer = mixerRef.current;
    if (!mixer) return; // not recording
    const next = await getMic(deviceId, true);
    if (!next) return; // keep the current mic
    const source = mixer.ctx.createMediaStreamSource(next);
    source.connect(mixer.dest);
    mixer.micSource?.disconnect();
    mixer.micStream?.getTracks().forEach((t) => t.stop());
    mixerRef.current = { ...mixer, micSource: source, micStream: next };
    console.log('Switched microphone:', next.getAudioTracks()[0]?.label);
  };

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

      // Mic is optional; record without it if unavailable
      const { micDeviceId } = (await chrome.storage.local.get('micDeviceId')) as ExtensionSettingsStorage;
      const micStream = await getMic(micDeviceId);

      // Always mix through an AudioContext so the mic can be swapped live
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();
      const systemAudioTracks = displayStream.getAudioTracks();
      if (systemAudioTracks.length > 0) {
        audioContext.createMediaStreamSource(new MediaStream(systemAudioTracks)).connect(dest);
      }
      const micSource = micStream ? audioContext.createMediaStreamSource(micStream) : null;
      micSource?.connect(dest);
      mixerRef.current = { ctx: audioContext, dest, micSource, micStream };

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

      // Drive the audio visualizer (local + broadcast to side panel).
      recordingStreamRef.current = finalStream;
      setAudioStream(finalStream);

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
        const duration = recordingTimerRef.current.stop();
        const rawBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const blob = await fixWebmDuration(rawBlob, duration, { logger: false });
        const url = URL.createObjectURL(blob);
        const filename = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
        const recordingId = Date.now().toString();

        // Save recording metadata and video to IndexedDB
        try {
          // Save video blob to IndexedDB
          await videoStorage.saveVideo(recordingId, blob);
          console.log('Video blob saved to IndexedDB');

          // Start download and get downloadId immediately
          console.log('Starting download...');
          chrome.downloads.download(
            {
              url: url,
              filename: filename,
              saveAs: true,
            },
            async (downloadId) => {
              // Save recording metadata with downloadId
              const result = await chrome.storage.local.get('recordings') as RecordingStorage;
              const recordings: Recording[] = result.recordings || [];

              const newRecording: Recording = {
                id: recordingId,
                filename: filename,
                timestamp: Date.now(),
                size: blob.size,
                downloadId: downloadId,
              };

              recordings.unshift(newRecording);

              // Keep only last 120 recordings
              if (recordings.length > 150) {
                const oldRecordings = recordings.splice(120);
                // Clean up old videos from IndexedDB
                for (const oldRec of oldRecordings) {
                  await videoStorage.deleteVideo(oldRec.id);
                }
              }

              await chrome.storage.local.set({ recordings });
              console.log('Recording metadata saved with downloadId:', downloadId);

              // Clean up blob URL
              URL.revokeObjectURL(url);

              // Trigger automatic transcription
              chrome.runtime.sendMessage({
                action: 'startAutoTranscription',
                recordingId: recordingId,
              });

              // Close tab after download starts
              setTimeout(() => chrome.tabs.getCurrent((tab) => tab && tab.id && chrome.tabs.remove(tab.id)), 1000);
            }
          );
        } catch (error) {
          console.error('Failed to save recording:', error);
        }
      };

      recorder.start(1000); // Collect data every second
      recordingTimerRef.current.start();
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

  const pauseRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    recorder.pause();
    recordingTimerRef.current.pause();
    setIsPaused(true);
    setAudioStream(null);
    chrome.runtime.sendMessage({ action: 'recordingPaused' });
  };

  const resumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;

    recorder.resume();
    recordingTimerRef.current.resume();
    setIsPaused(false);
    setAudioStream(recordingStreamRef.current);
    chrome.runtime.sendMessage({ action: 'recordingResumed' });
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && (recorder.state === 'recording' || recorder.state === 'paused')) {
      recordingTimerRef.current.stop();
      recorder.stop();
    }
    const mixer = mixerRef.current;
    mixerRef.current = null;
    mixer?.micStream?.getTracks().forEach((t) => t.stop());
    // Tear down the visualizer / stop broadcasting levels.
    setIsPaused(false);
    setAudioStream(null);
  };

  return (
    <div className="w-full h-screen bg-slate-900 dark:bg-black flex items-center justify-center relative">
      {showStartButton && (
        <div className="text-center text-white">
          <Button
            variant="primary"
            className="px-8 py-4 text-base rounded-full shadow-[0_2px_8px_rgba(66,133,244,0.3)] active:scale-[0.98]"
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
          <div className="bg-black/85 dark:bg-black/90 text-white px-8 py-4 rounded-full flex items-center gap-3 text-base font-medium shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${isPaused ? 'bg-amber-400' : 'bg-red-600 dark:bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite]'}`}></span>
            <span className="leading-none">
              {isPaused ? 'Recording paused' : 'Recording in progress...'}
            </span>
          </div>
          <div className="bg-black/85 dark:bg-black/90 px-6 py-3 rounded-2xl w-[280px] flex flex-col items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <AudioVisualizer levels={isPaused ? [] : audioLevels} isActive={!isPaused} className="w-full" />
            <span className="flex items-center gap-1.5 text-slate-300 text-xs">
              <Icon name="mic" size={12} />
              {isPaused ? 'Audio capture is paused' : 'Audio is being captured'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="px-7 py-4 text-base font-semibold rounded-full flex items-center gap-2"
              onClick={isPaused ? resumeRecording : pauseRecording}
            >
              <Icon name={isPaused ? "play" : "pause"} size={18} />
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="warning"
              className="px-8 py-4 text-base font-semibold rounded-full shadow-[0_4px_12px_rgba(222,53,11,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(222,53,11,0.4)] active:translate-y-0 flex items-center gap-2"
              onClick={stopRecording}
            >
              <Icon name="stop" size={18} />
              Stop & Download
            </Button>
          </div>
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
