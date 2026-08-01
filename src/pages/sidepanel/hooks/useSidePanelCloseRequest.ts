import { useEffect } from "react";
import { isCloseSidePanelMessage } from "../../../types";

/**
 * Closes this side panel when the background asks the panel in THIS browser
 * window to close (toggle from another extension page). Chrome has no
 * sidePanel.close() API, so the panel closes itself. The close request is a
 * runtime broadcast, so panels in other windows must ignore it.
 */
export const useSidePanelCloseRequest = () => {
  useEffect(() => {
    let cancelled = false;
    let cachedWindowId: number | null = null;

    // Never let a chrome API rejection escape into React's effect phase
    const resolveWindowId = async (): Promise<number | null> => {
      if (cachedWindowId !== null) return cachedWindowId;
      try {
        const win = await chrome.windows.getCurrent();
        cachedWindowId = win.id ?? null;
      } catch (error) {
        console.warn("[SidePanel] Could not resolve window id:", error);
        cachedWindowId = null;
      }
      return cachedWindowId;
    };

    // Warm the cache so a close request can normally be answered immediately
    void resolveWindowId();

    // Never returns true: this listener does not call sendResponse, so it must
    // not claim the async response channel from other extension pages.
    const closeListener = (message: unknown) => {
      if (!isCloseSidePanelMessage(message)) return;
      const targetWindowId = message.windowId;
      void resolveWindowId().then((windowId) => {
        // Unknown window id: ignore rather than risk closing another
        // window's panel.
        if (cancelled || windowId === null) return;
        if (windowId === targetWindowId) window.close();
      });
    };

    chrome.runtime.onMessage.addListener(closeListener);

    return () => {
      cancelled = true;
      chrome.runtime.onMessage.removeListener(closeListener);
    };
  }, []);
};
