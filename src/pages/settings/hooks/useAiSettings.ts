import { useState, useEffect } from "react";
import { DEFAULT_AI_PROVIDER, DEFAULT_AI_PROMPT, AI_PROVIDER_CONFIG } from "../../../types";
import type { AiProvider, AiProviderConfig } from "../../../types";

const VALID_PROVIDERS = Object.keys(AI_PROVIDER_CONFIG) as AiProvider[];

export const useAiSettings = () => {
  const [aiProvider, setAiProvider] = useState<AiProvider>(DEFAULT_AI_PROVIDER);
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_AI_PROMPT);

  useEffect(() => {
    const load = async () => {
      const result = await chrome.storage.local.get(["aiProvider", "chatGptPrompt"]);
      if (
        typeof result.aiProvider === "string" &&
        VALID_PROVIDERS.includes(result.aiProvider as AiProvider)
      ) {
        setAiProvider(result.aiProvider as AiProvider);
      }
      if (typeof result.chatGptPrompt === "string") {
        setAiPrompt(result.chatGptPrompt);
      }
    };
    load();

    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.aiProvider) {
        const newValue = changes.aiProvider.newValue;
        setAiProvider(
          typeof newValue === "string" &&
            VALID_PROVIDERS.includes(newValue as AiProvider)
            ? (newValue as AiProvider)
            : DEFAULT_AI_PROVIDER
        );
      }
      if (changes.chatGptPrompt) {
        const newValue = changes.chatGptPrompt.newValue;
        setAiPrompt(
          typeof newValue === "string" ? newValue : DEFAULT_AI_PROMPT
        );
      }
    };

    chrome.storage.local.onChanged.addListener(storageListener);
    return () => chrome.storage.local.onChanged.removeListener(storageListener);
  }, []);

  const handleProviderChange = async (value: AiProvider) => {
    setAiProvider(value);
    await chrome.storage.local.set({ aiProvider: value });
  };

  const handlePromptChange = async (value: string) => {
    setAiPrompt(value);
    await chrome.storage.local.set({ chatGptPrompt: value });
  };

  const aiProviderConfig: AiProviderConfig = AI_PROVIDER_CONFIG[aiProvider];
  const aiProviderLabel: string = aiProviderConfig.label;
  const isClipboardOnly: boolean = !!aiProviderConfig.clipboardOnly;

  return {
    aiProvider,
    aiProviderLabel,
    aiProviderConfig,
    aiPrompt,
    isClipboardOnly,
    handleProviderChange,
    handlePromptChange,
  };
};
