import { useState, useCallback } from "react";
import type { Toast, ToastLink } from "../types/toast";

/**
 * Hook for managing toast notifications
 * Provides methods to add, remove, and show toasts with different variants
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Generate a unique ID for a toast
   */
  const generateId = (): string => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Add a new toast notification
   */
  const addToast = useCallback(
    (toast: Omit<Toast, "id">): void => {
      const newToast: Toast = {
        ...toast,
        id: generateId(),
        duration: toast.duration || 5000, // Default 5 seconds
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  /**
   * Remove a toast notification by ID
   */
  const removeToast = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Show a success toast
   * @param message - Success message to display
   * @param link - Optional clickable link
   */
  const success = useCallback(
    (message: string, link?: ToastLink): void => {
      addToast({
        message,
        variant: "success",
        link,
        duration: link ? 7000 : 5000, // Longer duration if there's a link
      });
    },
    [addToast]
  );

  /**
   * Show an error toast
   * @param message - Error message to display
   */
  const error = useCallback(
    (message: string): void => {
      addToast({
        message,
        variant: "error",
        duration: 5000,
      });
    },
    [addToast]
  );

  /**
   * Show an info toast
   * @param message - Info message to display
   */
  const info = useCallback(
    (message: string): void => {
      addToast({
        message,
        variant: "info",
        duration: 5000,
      });
    },
    [addToast]
  );

  /**
   * Show a warning toast
   * @param message - Warning message to display
   * @param link - Optional clickable link
   */
  const warning = useCallback(
    (message: string, link?: ToastLink): void => {
      addToast({
        message,
        variant: "warning",
        link,
        duration: link ? 8000 : 5000, // Longer duration if there's a link
      });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
};
