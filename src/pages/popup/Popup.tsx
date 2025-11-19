import React, { useState, useEffect } from 'react';
import './Popup.css';

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
    <div className="popup-container">
      <h3>Window Recorder</h3>
      <button
        id="recordBtn"
        className={`record-btn ${isRecording ? 'hidden' : ''}`}
        onClick={handleStartRecording}
      >
        Start Recording
      </button>
      <button
        id="stopBtn"
        className={`stop-btn ${!isRecording ? 'hidden' : ''}`}
        onClick={handleStopRecording}
      >
        Stop & Download
      </button>
      <div id="status" className="status">
        {status}
      </div>
    </div>
  );
};

export default Popup;
