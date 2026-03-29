import React, { useState, useEffect, useRef } from "react";
import "../../index.css";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Icon from "../../components/Icon";
import CopyButton from "@src/components/CopyButton";
import type { RecordingSessionState } from "../../types";
import { useAiSettings } from "../settings/hooks/useAiSettings";

const SidePanel: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [recorderTabId, setRecorderTabId] = useState<number | null>(null);
  const recorderTabIdRef = useRef<number | null>(null);
  const [micStatus, setMicStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const { aiPrompt, aiProviderLabel } = useAiSettings();

  // Restore recording state from session storage on mount (handles reopen mid-recording)
  useEffect(() => {
    const restoreState = async () => {
      const data = await chrome.storage.session.get(["isRecording", "recorderTabId"]) as Partial<RecordingSessionState>;
      if (data.isRecording && data.recorderTabId) {
        try {
          await chrome.tabs.get(data.recorderTabId);
          setIsRecording(true);
          setRecorderTabId(data.recorderTabId);
          recorderTabIdRef.current = data.recorderTabId;
          setStatus("Recording in progress...");
        } catch {
          chrome.storage.session.set({ isRecording: false, recorderTabId: null } satisfies RecordingSessionState);
        }
      }
    };
    restoreState();

    // Stay in sync with background-driven state changes (e.g., tab closed)
    const sessionStorageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.isRecording) {
        const newVal = changes.isRecording.newValue;
        if (newVal) {
          setIsRecording(true);
          setStatus("Recording in progress...");
        } else {
          setIsRecording(false);
          setRecorderTabId(null);
          recorderTabIdRef.current = null;
        }
      }
      if (changes.recorderTabId) {
        const newTabId = (changes.recorderTabId.newValue as RecordingSessionState["recorderTabId"]) ?? null;
        setRecorderTabId(newTabId);
        recorderTabIdRef.current = newTabId;
      }
    };
    chrome.storage.session.onChanged.addListener(sessionStorageListener);

    return () => {
      chrome.storage.session.onChanged.removeListener(sessionStorageListener);
    };
  }, []);

  useEffect(() => {
    const messageListener = (msg: any) => {
      console.log("SidePanel received message:", JSON.stringify(msg));

      if (msg.action === "recordingStarted") {
        setIsRecording(true);
        setStatus("Recording in progress...");
      } else if (msg.action === "recordingError") {
        setStatus("Error: " + msg.error);
        setIsRecording(false);
        if (recorderTabIdRef.current) {
          chrome.tabs.remove(recorderTabIdRef.current);
          recorderTabIdRef.current = null;
          setRecorderTabId(null);
        }
      } else if (msg.action === "downloadReady") {
        setStatus("Download started!");
        setTimeout(() => {
          setStatus("");
          setIsRecording(false);
        }, 2000);
        recorderTabIdRef.current = null;
        setRecorderTabId(null);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [micStream]);

  const handleStartRecording = () => {
    setStatus("Opening recorder...");
    console.log("Starting capture flow...");

    // Create recorder tab with autostart parameter
    chrome.tabs.create(
      {
        url: chrome.runtime.getURL(
          "src/pages/recorder/index.html?autostart=true"
        ),
        active: true,
      },
      (createdTab) => {
        if (createdTab.id) {
          setRecorderTabId(createdTab.id);
          recorderTabIdRef.current = createdTab.id;
          chrome.storage.session.set({ isRecording: false, recorderTabId: createdTab.id } satisfies RecordingSessionState);
          console.log("Created recorder tab:", createdTab.id);
          setStatus("Select your screen in the new tab...");
        }
      }
    );
  };

  const handleStopRecording = async () => {
    if (!recorderTabId) return;

    try {
      await chrome.tabs.sendMessage(recorderTabId, { action: "stopRecording" });
      setIsRecording(false);
      setStatus("Processing download...");
    } catch (err: any) {
      setStatus("Error stopping: " + err.message);
    }
  };

  const handleManageRecordings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/pages/recordings/index.html"),
    });
  };

  const handleViewSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/pages/recordings/index.html#/settings"),
    });
  };

  const handleTestMicrophone = async () => {
    if (micStatus === "testing") {
      // Stop testing
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
        setMicStream(null);
      }
      setMicStatus("idle");
      return;
    }

    setMicStatus("testing");
    console.log("Testing microphone...");

    try {
      // Check if any microphone devices exist
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === "audioinput");

      if (audioInputs.length === 0) {
        console.warn("No microphone devices found");
        setStatus("No microphone found. Please connect a microphone and try again.");
        setMicStatus("error");
        setTimeout(() => setMicStatus("idle"), 5000);
        return;
      }

      // Check permission status
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      if (permissionStatus.state === "denied") {
        console.warn("Microphone permission denied");
        setStatus("Microphone permission denied. Please allow access in your browser site settings.");
        setMicStatus("error");
        setTimeout(() => setMicStatus("idle"), 5000);
        return;
      }

      // This will trigger the permission prompt if state is "prompt"
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      console.log("Microphone access granted:", stream);
      setMicStream(stream);
      setMicStatus("success");

      // Create audio context to verify microphone is working
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      microphone.connect(analyser);

      // Microphone is now active and verified
      console.log("Microphone is active and capturing audio");

      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          audioContext.close();
          setMicStream(null);
          setMicStatus("idle");
        }
      }, 3000);
    } catch (err: any) {
      console.error("Microphone test failed:", err);
      setMicStatus("error");

      if (err.name === "NotFoundError") {
        setStatus("No microphone found. Please connect a microphone and try again.");
      } else if (err.name === "NotAllowedError") {
        setStatus("Microphone permission denied. Please allow access in your browser site settings.");
      } else {
        setStatus("Microphone test failed: " + err.message);
      }

      // Reset after 5 seconds
      setTimeout(() => {
        setMicStatus("idle");
      }, 5000);
    }
  };

  return (
    <div className="w-full min-h-screen m-0 p-0 font-sans bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
      <div className="p-5 px-4 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
        <h2 className="m-0 mb-1 text-xl font-medium text-slate-900 dark:text-slate-100">
          Jira Quick Video Recorder
        </h2>
        <p className="m-0 text-xs text-slate-600 dark:text-slate-400 font-normal">
          Start recording from here
        </p>
      </div>

      <div className="p-4 flex-1 bg-slate-100 dark:bg-slate-800/50">
        <Button
          variant="primary"
          rounded="full"
          fullWidth
          className={`mb-2 px-4 py-2.5 ${isRecording ? "hidden" : ""}`}
          onClick={handleStartRecording}
          disabled={isRecording}
        >
          Start Recording
        </Button>

        <Button
          variant="warning"
          rounded="full"
          fullWidth
          className={`mb-2 px-4 py-2.5 flex items-center justify-center gap-2 ${!isRecording ? "hidden" : ""}`}
          onClick={handleStopRecording}
          disabled={!isRecording}
        >
          <Icon name="stop" size={16} />
          Stop & Download
        </Button>

        <Button
          variant={
            micStatus === "success"
              ? "success"
              : micStatus === "error"
              ? "error"
              : "secondary"
          }
          rounded="full"
          fullWidth
          className={`mb-2 px-4 py-2.5 flex items-center justify-center gap-2 ${isRecording ? "hidden" : ""}`}
          onClick={handleTestMicrophone}
          disabled={isRecording}
        >
          {micStatus === "testing" && <Icon name="record" size={16} />}
          {micStatus === "success" && <Icon name="check-circle" size={16} />}
          {micStatus === "error" && <Icon name="x-circle" size={16} />}
          {micStatus === "idle" && "Test Microphone"}
          {micStatus === "testing" && "Testing... (3s)"}
          {micStatus === "success" && "Microphone OK!"}
          {micStatus === "error" && "Microphone Error"}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          rounded="full"
          className="mb-2 px-4 py-2.5 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
          onClick={handleManageRecordings}
        >
          <Icon name="folder" size={16} />
          Manage Recordings
        </Button>
        <Button
          variant="secondary"
          fullWidth
          rounded="full"
          className="mb-4 px-4 py-2.5 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
          onClick={handleViewSettings}
        >
          <Icon name="settings" size={16} />
          View Settings
        </Button>

        {status && (
          <div className="mt-3 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded flex items-center gap-2 text-xs text-left text-slate-600 dark:text-slate-300">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isRecording
                  ? "bg-red-600 animate-[pulse_1.5s_ease-in-out_infinite]"
                  : "bg-slate-400 dark:bg-slate-500"
              }`}
            ></span>
            {status}
          </div>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 mt-auto">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <Icon name="brain" size={16} /> {aiProviderLabel} Prompt
          <CopyButton textToCopy={aiPrompt} />
        </h3>

        <div className="mb-4">
          <h3 className="m-0 mb-2 text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            How to use:
          </h3>
          <ol className="m-0 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <li className="mb-1">Click "Start Recording"</li>
            <li className="mb-1">Select your screen/window</li>
            <li className="mb-1">Grant microphone access</li>
            <li className="mb-1">Click "Stop & Download" when done</li>
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <Badge>✓ Screen + Microphone</Badge>
          <Badge>✓ System Audio</Badge>
          <Badge>✓ 1080p @ 30fps</Badge>
          <Badge>✓ WebM format</Badge>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
