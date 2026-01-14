import { useState, useEffect } from "react";
import { geminiAuth } from "../../../utils/geminiAuth";

/**
 * Hook to manage Gemini connection status and authentication
 */
export const useGeminiConnection = () => {
  const [isGeminiConnected, setIsGeminiConnected] = useState(false);

  useEffect(() => {
    checkGeminiConnection();

    // Listen for storage changes to detect when Gemini connection changes
    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.geminiTokens) {
        checkGeminiConnection();
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(storageListener);
    };
  }, []);

  const checkGeminiConnection = async () => {
    const connected = await geminiAuth.isAuthenticated();
    setIsGeminiConnected(connected);
  };

  const handleConnect = async () => {
    await geminiAuth.authenticate();
  };

  const handleDisconnect = async () => {
    if (window.confirm("Are you sure you want to disconnect from Gemini?")) {
      await geminiAuth.disconnect();
    }
  };

  return {
    isGeminiConnected,
    handleConnect,
    handleDisconnect,
  };
};
