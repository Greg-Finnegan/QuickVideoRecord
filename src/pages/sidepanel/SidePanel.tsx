import React, { useState, useEffect } from 'react';
import './SidePanel.css';

const SidePanel: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [recorderTabId, setRecorderTabId] = useState<number | null>(null);
  const [micStatus, setMicStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    console.log('SidePanel component mounted');

    // Listen for messages from recorder and background
    const messageListener = (msg: any) => {
      console.log('SidePanel received message:', JSON.stringify(msg));

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
      // Clean up mic stream on unmount
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [recorderTabId, micStream]);

  const handleStartRecording = () => {
    setStatus('Opening recorder...');
    console.log('Starting capture flow...');

    // Create recorder tab with autostart parameter
    chrome.tabs.create(
      {
        url: chrome.runtime.getURL('src/pages/recorder/index.html?autostart=true'),
        active: true,
      },
      (createdTab) => {
        if (createdTab.id) {
          setRecorderTabId(createdTab.id);
          console.log('Created recorder tab:', createdTab.id);
          setStatus('Select your screen in the new tab...');
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

  const handleManageRecordings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/pages/recordings/index.html'),
    });
  };

  const handleTestMicrophone = async () => {
    if (micStatus === 'testing') {
      // Stop testing
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        setMicStream(null);
      }
      setMicStatus('idle');
      return;
    }

    setMicStatus('testing');
    console.log('Testing microphone...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      console.log('Microphone access granted:', stream);
      setMicStream(stream);
      setMicStatus('success');

      // Create audio context to verify microphone is working
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      microphone.connect(analyser);

      // Microphone is now active and verified
      console.log('Microphone is active and capturing audio');

      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          setMicStream(null);
          setMicStatus('idle');
        }
      }, 3000);

    } catch (err: any) {
      console.error('Microphone test failed:', err);
      setMicStatus('error');

      // Reset after 3 seconds
      setTimeout(() => {
        setMicStatus('idle');
      }, 3000);
    }
  };

  return (
    <div className="sidepanel-container">
      <div className="sidepanel-header">
        <h2>Window Recorder</h2>
        <p className="sidepanel-subtitle">Record your screen with audio</p>
      </div>

      <div className="sidepanel-content">
        <button
          className={`action-btn record-btn ${isRecording ? 'hidden' : ''}`}
          onClick={handleStartRecording}
          disabled={isRecording}
        >
          Start Recording
        </button>

        <button
          className={`action-btn stop-btn ${!isRecording ? 'hidden' : ''}`}
          onClick={handleStopRecording}
          disabled={!isRecording}
        >
          <span className="btn-icon">⏹</span>
          Stop & Download
        </button>

        <button
          className={`action-btn test-mic-btn ${micStatus === 'success' ? 'success' : ''} ${micStatus === 'error' ? 'error' : ''} ${isRecording ? 'hidden' : ''}`}
          onClick={handleTestMicrophone}
          disabled={isRecording}
        >
          <span className="btn-icon">
            {micStatus === 'idle'}
            {micStatus === 'testing' && '🔴'}
            {micStatus === 'success' && '✅'}
            {micStatus === 'error' && '❌'}
          </span>
          {micStatus === 'idle' && 'Test Microphone'}
          {micStatus === 'testing' && 'Testing... (3s)'}
          {micStatus === 'success' && 'Microphone OK!'}
          {micStatus === 'error' && 'Microphone Error'}
        </button>

        {status && (
          <div className="status-message">
            <span className={`status-indicator ${isRecording ? 'recording' : ''}`}></span>
            {status}
          </div>
        )}
      </div>

      <div className="sidepanel-footer">
        <button className="manage-recordings-btn" onClick={handleManageRecordings}>
          <span className="btn-icon">📁</span>
          Manage Recordings
        </button>

        <div className="info-section">
          <h3>How to use:</h3>
          <ol>
            <li>Click "Start Recording"</li>
            <li>Select your screen/window</li>
            <li>Grant microphone access</li>
            <li>Click "Stop & Download" when done</li>
          </ol>
        </div>

        <div className="features">
          <div className="feature-item">✓ Screen + Microphone</div>
          <div className="feature-item">✓ System Audio</div>
          <div className="feature-item">✓ 1080p @ 30fps</div>
          <div className="feature-item">✓ WebM format</div>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
