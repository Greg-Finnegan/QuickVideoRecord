import React, { useState, useEffect } from "react";
import "../../index.css";
import Button from "../../components/Button";

const Popup: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [recorderTabId, setRecorderTabId] = useState<number | null>(null);

  useEffect(() => {
    // Listen for messages from recorder and background
    const messageListener = (msg: any) => {
      console.log("Popup received message:", JSON.stringify(msg));

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
    };
  }, [recorderTabId]);

  const handleStartRecording = () => {
    setStatus("Opening recorder...");
    console.log("Starting capture flow...");

    // Create recorder tab - it will handle everything
    chrome.tabs.create(
      {
        url: chrome.runtime.getURL("src/pages/recorder/index.html"),
        active: true, // Make it active so getDisplayMedia works
      },
      (createdTab) => {
        if (createdTab.id) {
          setRecorderTabId(createdTab.id);
          console.log("Created recorder tab:", createdTab.id);
          setStatus("Recorder opened - select your screen...");
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

  return (
    <div className="w-full min-h-screen m-0 p-5 font-sans text-center bg-white dark:bg-slate-900">
      <h3 className="mt-0 text-slate-900 dark:text-slate-100">
        Window Recorder
      </h3>
      <Button
        id="recordBtn"
        variant="primary"
        className={`my-2 w-[200px] ${isRecording ? "hidden" : ""}`}
        onClick={handleStartRecording}
      >
        Start Recording
      </Button>
      <Button
        id="stopBtn"
        variant="warning"
        className={`my-2 w-[200px] ${!isRecording ? "hidden" : ""}`}
        onClick={handleStopRecording}
      >
        Stop & Download
      </Button>
      <div
        id="status"
        className="mt-4 text-[13px] text-slate-600 dark:text-slate-400 p-2 min-h-[20px]"
      >
        {status}
      </div>
    </div>
  );
};

export default Popup;
