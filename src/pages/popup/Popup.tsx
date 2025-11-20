import React, { useState, useEffect } from 'react';
import '../../index.css';

const Popup: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [recorderTabId, setRecorderTabId] = useState<number | null>(null);

  useEffect(() => {
    // Listen for messages from recorder and background
    const messageListener = (msg: any) => {
      console.log('Popup received message:', JSON.stringify(msg));

      if (msg.action === 'recordingStarted') {
        setIsRecording(true);
        setStatus('Recording in progress...');
      } else if (msg.action === 'recordingError') {
        setStatus('Error: ' + msg.error);
        setIsRecording(false);
        if (recorderTabId) {
          chrome.tabs.remove(recorderTabId);
          setRecorderTabId(null);
        }
      } else if (msg.action === 'downloadReady') {
        setStatus('Download started!');
        setTimeout(() => {
          setStatus('');
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
    setStatus('Opening recorder...');
    console.log('Starting capture flow...');

    // Create recorder tab - it will handle everything
    chrome.tabs.create(
      {
        url: chrome.runtime.getURL('src/pages/recorder/index.html'),
        active: true, // Make it active so getDisplayMedia works
      },
      (createdTab) => {
        if (createdTab.id) {
          setRecorderTabId(createdTab.id);
          console.log('Created recorder tab:', createdTab.id);
          setStatus('Recorder opened - select your screen...');
        }
      }
    );
  };

  const handleStopRecording = async () => {
    if (!recorderTabId) return;

    try {
      await chrome.tabs.sendMessage(recorderTabId, { action: 'stopRecording' });
      setIsRecording(false);
      setStatus('Processing download...');
    } catch (err: any) {
      setStatus('Error stopping: ' + err.message);
    }
  };

  return (
    <div className="w-full min-h-screen m-0 p-5 font-sans text-center bg-white dark:bg-slate-900">
      <h3 className="mt-0 text-slate-900 dark:text-slate-100">Window Recorder</h3>
      <button
        id="recordBtn"
        className={`px-6 py-3 my-2 text-sm cursor-pointer border-none rounded-md transition-colors w-[200px] font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 ${isRecording ? 'hidden' : ''}`}
        onClick={handleStartRecording}
      >
        Start Recording
      </button>
      <button
        id="stopBtn"
        className={`px-6 py-3 my-2 text-sm cursor-pointer border-none rounded-md transition-colors w-[200px] font-medium bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 ${!isRecording ? 'hidden' : ''}`}
        onClick={handleStopRecording}
      >
        Stop & Download
      </button>
      <div id="status" className="mt-4 text-[13px] text-slate-600 dark:text-slate-400 p-2 min-h-[20px]">
        {status}
      </div>
    </div>
  );
};

export default Popup;
