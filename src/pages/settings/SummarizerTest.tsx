import React from "react";
import Button from "../../components/Button";
import { useSummarizerTest } from "./hooks/useSummarizerTest";

const SummarizerTest: React.FC = () => {
  const {
    isSupported,
    availability,
    downloadProgress,
    inputText,
    setInputText,
    summary,
    loading,
    error,
    summarize,
  } = useSummarizerTest();

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
        Summarizer API Test
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Test Chrome's built-in Summarizer API (requires Chrome 138+).
      </p>

      {/* Status */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isSupported ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {!isSupported
            ? "Summarizer API not supported in this browser"
            : availability === "available"
              ? "Model ready"
              : availability === "downloadable"
                ? "Model available for download"
                : availability === "downloading"
                  ? "Model downloading..."
                  : `Status: ${availability ?? "checking..."}`}
        </span>
      </div>

      {isSupported && (
        <>
          <textarea
            className="w-full h-32 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm resize-y mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Paste text here to summarize..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          {downloadProgress !== null && (
            <div className="mb-3">
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

          <Button
            variant="secondary"
            rounded="full"
            onClick={summarize}
            disabled={loading || !inputText.trim()}
          >
            {loading ? "Summarizing..." : "Summarize"}
          </Button>

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {summary && (
            <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Summary
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {summary}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummarizerTest;
