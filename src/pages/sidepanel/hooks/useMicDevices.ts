import { useEffect, useState } from "react";
import type { ExtensionSettingsStorage } from "../../../types";

/**
 * Lists microphones and persists the selection as `micDeviceId` in
 * chrome.storage.local (read by the recorder). Device labels are empty until
 * mic permission is granted, so call `refresh()` after a successful test.
 */
export const useMicDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [micDeviceId, setMicDeviceId] = useState("");

  const refresh = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((d) => d.kind === "audioinput"));
    } catch (error) {
      console.warn("[SidePanel] Could not list microphones:", error);
    }
  };

  useEffect(() => {
    void refresh();
    chrome.storage.local.get("micDeviceId").then((result) => {
      const { micDeviceId: stored } = result as ExtensionSettingsStorage;
      setMicDeviceId(typeof stored === "string" ? stored : "");
    });

    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => navigator.mediaDevices.removeEventListener("devicechange", refresh);
  }, []);

  const selectMic = async (deviceId: string) => {
    setMicDeviceId(deviceId);
    await chrome.storage.local.set({ micDeviceId: deviceId });
  };

  return { devices, micDeviceId, selectMic, refresh };
};
