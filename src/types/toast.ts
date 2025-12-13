/**
 * Toast notification data structure
 */
export interface Toast {
  id: string;
  message: string;
  variant: "success" | "error" | "info" | "warning";
  duration?: number;
  link?: ToastLink;
}

/**
 * Link embedded in a toast notification
 */
export interface ToastLink {
  text: string;
  url: string;
}
