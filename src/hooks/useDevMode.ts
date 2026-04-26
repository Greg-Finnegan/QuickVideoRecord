import { useState, useEffect } from "react";

export const useDevMode = () => {
  const [devMode, setDevModeState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get("devMode").then((result) => {
      setDevModeState(result.devMode === true);
      setLoading(false);
    });

    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.devMode) {
        setDevModeState(changes.devMode.newValue === true);
      }
    };

    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  const setDevMode = (enabled: boolean) => {
    setDevModeState(enabled);
    chrome.storage.local.set({ devMode: enabled });
  };

  return { devMode, setDevMode, loading };
};
