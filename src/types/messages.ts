/**
 * Side panel message contract shared by the background service worker,
 * the side panel and the extension pages that open/toggle it.
 */

export interface OpenSidePanelMessage {
  action: "openSidePanel";
}

export interface ToggleSidePanelMessage {
  action: "toggleSidePanel";
}

export interface CloseSidePanelMessage {
  action: "closeSidePanel";
  /** Only the side panel hosted in this browser window should close itself */
  windowId: number;
}

export type SidePanelMessage =
  | OpenSidePanelMessage
  | ToggleSidePanelMessage
  | CloseSidePanelMessage;

/** Chrome message payloads are untyped, so validate before trusting them */
export const isCloseSidePanelMessage = (
  message: unknown
): message is CloseSidePanelMessage => {
  if (typeof message !== "object" || message === null) return false;
  const candidate = message as Partial<CloseSidePanelMessage>;
  return (
    candidate.action === "closeSidePanel" &&
    typeof candidate.windowId === "number"
  );
};
