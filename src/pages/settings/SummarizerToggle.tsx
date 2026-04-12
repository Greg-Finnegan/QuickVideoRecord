import React from "react";
import { useSummarizer } from "./hooks/useSummarizer";

const SummarizerToggle: React.FC = () => {
  const {
    isSupported,
    availability,
    summarizerEnabled,
    downloadProgress,
    loading,
    error,
    handleToggle,
  } = useSummarizer();

  const statusText = !isSupported
    ? "Summarizer API not supported (requires Chrome 138+)"
    : availability === "available"
      ? "Model ready"
      : availability === "downloadable"
        ? "Model available for download"
        : availability === "downloading"
          ? "Model downloading..."
          : `Status: ${availability ?? "checking..."}`;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
          Auto-Generate Filenames
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={summarizerEnabled}
          disabled={!isSupported || loading}
          onClick={() => handleToggle(!summarizerEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            summarizerEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              summarizerEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
        Use Chrome's built-in AI to generate descriptive filenames from
        transcripts after recording.
      </p>

      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            !isSupported
              ? "bg-red-500"
              : availability === "available"
                ? "bg-green-500"
                : "bg-amber-500"
          }`}
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {statusText}
        </span>
      </div>

      {downloadProgress !== null && (
        <div className="mt-3">
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Downloading model: {downloadProgress}%
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default SummarizerToggle;
