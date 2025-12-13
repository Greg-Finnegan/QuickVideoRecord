import React, { useEffect, useState } from "react";
import type { Toast as ToastType } from "../types/toast";

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Slide in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (isPaused || !toast.duration) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, isPaused]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for animation to complete before removing
    setTimeout(() => onDismiss(toast.id), 300);
  };

  // Variant-specific styles
  const variantStyles = {
    success:
      "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700 text-green-900 dark:text-green-100",
    error:
      "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700 text-red-900 dark:text-red-100",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-700 text-blue-900 dark:text-blue-100",
    warning:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100",
  };

  // Variant-specific icons
  const variantIcons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  return (
    <div
      className={`
        ${variantStyles[toast.variant]}
        border-l-4 rounded-r-md p-4 shadow-lg
        min-w-[300px] max-w-[500px]
        transition-all duration-300 ease-in-out
        ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-xl font-bold">
          {variantIcons[toast.variant]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{toast.message}</p>

          {/* Link if provided */}
          {toast.link && (
            <a
              href={toast.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm font-semibold underline hover:no-underline transition-all"
            >
              {toast.link.text} →
            </a>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-lg font-bold opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Toast;
