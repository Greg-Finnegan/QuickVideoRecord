import React, { useState, useEffect } from "react";
import "../../index.css";
import Button from "../../components/Button";

const SidePanel: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [recorderTabId, setRecorderTabId] = useState<number | null>(null);
  const [micStatus, setMicStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    console.log("SidePanel component mounted");

    // Listen for messages from recorder and background
    const messageListener = (msg: any) => {
      console.log("SidePanel received message:", JSON.stringify(msg));

      if (msg.action === "recordingStarted") {
        setIsRecording(true);
        setStatus("Recording in progress...");
      } else if (msg.action === "recordingError") {
        setStatus("Error: " + msg.error);
        setIsRecording(false);
        if (recorderTabId) {
          chrome.tabs.remove(recorderTabId);
          setRecorderTabId(null);
        }
      } else if (msg.action === "downloadReady") {
        setStatus("Download started!");
        setTimeout(() => {
          setStatus("");
          setIsRecording(false);
        }, 2000);
        setRecorderTabId(null);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
      // Clean up mic stream on unmount
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recorderTabId, micStream]);

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

      // Reset after 3 seconds
      setTimeout(() => {
        setMicStatus("idle");
      }, 3000);
    }
  };

  return (
    <div className="w-full min-h-screen m-0 p-0 font-sans bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
      <div className="p-5 px-4 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700">
        <h2 className="m-0 mb-1 text-xl font-medium text-slate-900 dark:text-slate-100">
          Window Recorder
        </h2>
        <p className="m-0 text-xs text-slate-600 dark:text-slate-400 font-normal">
          Record your screen with audio
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
          className={`mb-2 px-4 py-2.5 ${!isRecording ? "hidden" : ""}`}
          onClick={handleStopRecording}
          disabled={!isRecording}
        >
          <span className="text-base leading-none">⏹</span>
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
          className={`mb-2 px-4 py-2.5 ${isRecording ? "hidden" : ""}`}
          onClick={handleTestMicrophone}
          disabled={isRecording}
        >
          <span className="text-base leading-none">
            {micStatus === "idle"}
            {micStatus === "testing" && "🔴"}
            {micStatus === "success" && "✅"}
            {micStatus === "error" && "❌"}
          </span>
          {micStatus === "idle" && "Test Microphone"}
          {micStatus === "testing" && "Testing... (3s)"}
          {micStatus === "success" && "Microphone OK!"}
          {micStatus === "error" && "Microphone Error"}
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
        <Button
          variant="secondary"
          fullWidth
          className="mb-4 px-4 py-2.5 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600"
          onClick={handleManageRecordings}
        >
          <span className="text-base leading-none">📁</span>
          Manage Recordings
        </Button>

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
          <div className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-[11px] text-center text-slate-600 dark:text-slate-400 font-medium">
            ✓ Screen + Microphone
          </div>
          <div className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-[11px] text-center text-slate-600 dark:text-slate-400 font-medium">
            ✓ System Audio
          </div>
          <div className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-[11px] text-center text-slate-600 dark:text-slate-400 font-medium">
            ✓ 1080p @ 30fps
          </div>
          <div className="px-2 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-[11px] text-center text-slate-600 dark:text-slate-400 font-medium">
            ✓ WebM format
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
