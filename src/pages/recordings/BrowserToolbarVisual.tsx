import React from "react";

const BrowserToolbarVisual: React.FC = () => {
  return (
    <div className="relative w-96">
      {/* Browser chrome frame */}
      <div className="bg-slate-200 dark:bg-slate-700 rounded-t-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-end gap-0.5 px-3 pt-3">
          <div className="bg-white dark:bg-slate-800 rounded-t-lg px-5 py-2 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="w-16 h-2.5 rounded bg-slate-300 dark:bg-slate-600" />
          </div>
          <div className="bg-slate-300 dark:bg-slate-600 rounded-t-lg px-4 py-1.5 flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            <div className="w-12 h-2.5 rounded bg-slate-400 dark:bg-slate-500" />
          </div>
        </div>

        {/* Toolbar row: nav buttons, URL bar, extensions */}
        <div className="bg-white dark:bg-slate-800 flex items-center gap-3 px-4 py-2.5">
          {/* Nav buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600" />
            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-600" />
          </div>

          {/* URL bar */}
          <div className="flex-1 h-7 rounded-full bg-slate-100 dark:bg-slate-700" />

          {/* Extension icons area */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="relative">
              {/* Our extension icon - highlighted */}
              <img
                src="/icon-48.png"
                alt="Extension icon"
                className="w-5 h-5 rounded ring-2 ring-blue-400/30 dark:ring-blue-500/30"
              />

              {/* Animated cursor clicking the icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute -bottom-3 -right-3 w-5 h-5 text-slate-700 dark:text-slate-200 animate-[click_2s_ease-in-out_infinite] drop-shadow-md"
              >
                <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
              </svg>
            </div>
            <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        </div>
      </div>

      {/* Page content skeleton */}
      <div className="bg-white dark:bg-slate-800 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-xl px-5 py-5 space-y-3">
        <div className="w-3/4 h-3 rounded bg-slate-100 dark:bg-slate-700" />
        <div className="w-full h-3 rounded bg-slate-100 dark:bg-slate-700" />
        <div className="w-5/6 h-3 rounded bg-slate-100 dark:bg-slate-700" />
      </div>

      <style>{`
        @keyframes click {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.9; }
          40% { transform: translate(-1px, -1px) scale(1); opacity: 1; }
          50% { transform: translate(-1px, -1px) scale(0.85); opacity: 1; }
          60% { transform: translate(-1px, -1px) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default BrowserToolbarVisual;
