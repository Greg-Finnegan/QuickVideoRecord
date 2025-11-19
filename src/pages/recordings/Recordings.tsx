import React, { useState, useEffect } from 'react';
import './Recordings.css';

interface Recording {
  id: string;
  filename: string;
  timestamp: number;
  duration?: number;
  size?: number;
}

const Recordings: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const result = await chrome.storage.local.get('recordings');
      const savedRecordings = result.recordings || [];
      setRecordings(savedRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = async (id: string) => {
    const updatedRecordings = recordings.filter((r) => r.id !== id);
    await chrome.storage.local.set({ recordings: updatedRecordings });
    setRecordings(updatedRecordings);
  };

  const clearAllRecordings = async () => {
    if (window.confirm('Are you sure you want to clear all recording history?')) {
      await chrome.storage.local.set({ recordings: [] });
      setRecordings([]);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="recordings-container">
      <div className="recordings-header">
        <h1>Recording History</h1>
        <p className="recordings-subtitle">
          View and manage your screen recordings
        </p>
      </div>

      <div className="recordings-content">
        {loading ? (
          <div className="recordings-empty">
            <p>Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="recordings-empty">
            <div className="empty-icon">📹</div>
            <h2>No recordings yet</h2>
            <p>Your recording history will appear here after you create your first recording.</p>
          </div>
        ) : (
          <>
            <div className="recordings-actions">
              <button className="clear-all-btn" onClick={clearAllRecordings}>
                Clear All History
              </button>
            </div>
            <div className="recordings-list">
              {recordings.map((recording) => (
                <div key={recording.id} className="recording-card">
                  <div className="recording-icon">🎥</div>
                  <div className="recording-info">
                    <h3 className="recording-filename">{recording.filename}</h3>
                    <div className="recording-meta">
                      <span className="meta-item">
                        📅 {formatDate(recording.timestamp)}
                      </span>
                      {recording.duration && (
                        <span className="meta-item">
                          ⏱️ {formatDuration(recording.duration)}
                        </span>
                      )}
                      {recording.size && (
                        <span className="meta-item">
                          💾 {formatSize(recording.size)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => deleteRecording(recording.id)}
                    title="Remove from history"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Recordings;
