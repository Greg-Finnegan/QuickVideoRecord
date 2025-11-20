import React, { useState, useEffect } from 'react';
import '../../index.css';

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
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="bg-white border-b-2 border-slate-200 px-10 py-8">
        <h1 className="m-0 mb-2 text-2xl font-medium text-slate-900">Recording History</h1>
        <p className="m-0 text-sm text-slate-600">
          View and manage your screen recordings
        </p>
      </div>

      <div className="px-10 py-6 max-w-[1200px] mx-auto">
        {loading ? (
          <div className="text-center py-20 px-5">
            <p>Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <div className="text-center py-20 px-5">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="m-0 mb-2 text-xl font-medium text-slate-900">No recordings yet</h2>
            <p className="m-0 text-sm text-slate-600">Your recording history will appear here after you create your first recording.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                className="bg-white text-slate-600 border border-slate-300 px-4 py-2 text-sm font-medium rounded cursor-pointer transition-colors hover:bg-slate-100"
                onClick={clearAllRecordings}
              >
                Clear All History
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="bg-white border border-slate-300 rounded p-4 flex items-center gap-4 transition-all hover:border-slate-400 hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                >
                  <div className="text-[32px] flex-shrink-0">🎥</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="m-0 mb-2 text-sm font-medium text-slate-900 break-words">{recording.filename}</h3>
                    <div className="flex flex-wrap gap-4">
                      <span className="text-xs text-slate-600 flex items-center gap-1">
                        📅 {formatDate(recording.timestamp)}
                      </span>
                      {recording.duration && (
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          ⏱️ {formatDuration(recording.duration)}
                        </span>
                      )}
                      {recording.size && (
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          💾 {formatSize(recording.size)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="bg-transparent border border-slate-300 px-3 py-2 text-lg rounded cursor-pointer transition-all flex-shrink-0 hover:bg-red-600 hover:border-red-600"
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
