import React from "react";
import Toast from "./Toast";
import type { Toast as ToastType } from "../types/toast";

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

/**
 * Container for toast notifications
 * Positioned at top-right corner, stacks toasts vertically
 */
const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[60] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
