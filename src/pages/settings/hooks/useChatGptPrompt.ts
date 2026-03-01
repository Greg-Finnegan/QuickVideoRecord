import { useState, useEffect } from "react";
import { DEFAULT_CHATGPT_PROMPT } from "../../../types";

export const useChatGptPrompt = () => {
  const [chatGptPrompt, setChatGptPrompt] = useState(DEFAULT_CHATGPT_PROMPT);

  useEffect(() => {
    const loadPrompt = async () => {
      const result = await chrome.storage.local.get("chatGptPrompt");
      if (typeof result.chatGptPrompt === "string") {
        setChatGptPrompt(result.chatGptPrompt);
      }
    };
    loadPrompt();

    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.chatGptPrompt) {
        const newValue = changes.chatGptPrompt.newValue;
        setChatGptPrompt(
          typeof newValue === "string" ? newValue : DEFAULT_CHATGPT_PROMPT
        );
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);
    return () => chrome.storage.local.onChanged.removeListener(storageListener);
  }, []);

  const handlePromptChange = async (value: string) => {
    setChatGptPrompt(value);
    await chrome.storage.local.set({ chatGptPrompt: value });
  };

  return { chatGptPrompt, handlePromptChange };
};
