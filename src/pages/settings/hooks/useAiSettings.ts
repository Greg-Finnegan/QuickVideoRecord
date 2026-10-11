import { useState, useEffect } from "react";
import {
  DEFAULT_AI_PROVIDER,
  DEFAULT_AI_PROMPT,
  AI_PROVIDER_CONFIG,
  AI_API_PROVIDER_CONFIG,
  isActiveAiApiProvider,
} from "../../../types";
import type { ActiveAiApiProvider, AiApiProvider, AiProvider, AiProviderConfig } from "../../../types";

const VALID_PROVIDERS = Object.keys(AI_PROVIDER_CONFIG) as AiProvider[];

type PerProvider = Partial<Record<ActiveAiApiProvider, string>>;

const toApiProvider = (value: unknown): AiApiProvider =>
  isActiveAiApiProvider(value) ? value : "off";

const toPerProvider = (value: unknown): PerProvider =>
  typeof value === "object" && value !== null ? (value as PerProvider) : {};

export const useAiSettings = () => {
  const [aiProvider, setAiProvider] = useState<AiProvider>(DEFAULT_AI_PROVIDER);
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_AI_PROMPT);
  const [aiApiProvider, setAiApiProvider] = useState<AiApiProvider>("off");
  const [aiApiKeys, setAiApiKeys] = useState<PerProvider>({});
  const [aiApiModels, setAiApiModels] = useState<PerProvider>({});

  useEffect(() => {
    const load = async () => {
      const result = await chrome.storage.local.get([
        "aiProvider",
        "chatGptPrompt",
        "aiApiProvider",
        "aiApiKeys",
        "aiApiModels",
      ]);
      setAiApiProvider(toApiProvider(result.aiApiProvider));
      setAiApiKeys(toPerProvider(result.aiApiKeys));
      setAiApiModels(toPerProvider(result.aiApiModels));
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
      if (changes.aiApiProvider) {
        setAiApiProvider(toApiProvider(changes.aiApiProvider.newValue));
      }
      if (changes.aiApiKeys) {
        setAiApiKeys(toPerProvider(changes.aiApiKeys.newValue));
      }
      if (changes.aiApiModels) {
        setAiApiModels(toPerProvider(changes.aiApiModels.newValue));
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

  const handleApiProviderChange = async (value: AiApiProvider) => {
    setAiApiProvider(value);
    await chrome.storage.local.set({ aiApiProvider: value });
  };

  // Keys and models are stored per provider so switching providers keeps each one
  const handleApiKeyChange = async (value: string) => {
    if (aiApiProvider === "off") return;
    const next = { ...aiApiKeys, [aiApiProvider]: value };
    setAiApiKeys(next);
    await chrome.storage.local.set({ aiApiKeys: next });
  };

  const handleApiModelChange = async (value: string) => {
    if (aiApiProvider === "off") return;
    const next = { ...aiApiModels, [aiApiProvider]: value };
    setAiApiModels(next);
    await chrome.storage.local.set({ aiApiModels: next });
  };

  const active = aiApiProvider === "off" ? null : aiApiProvider;
  const aiApiKey = (active && aiApiKeys[active]) ?? "";
  const aiApiModel = (active && aiApiModels[active]) ?? "";
  // Mirrors the check in background startTranscription
  const isAiApiActive = aiApiKey.trim().length > 0;
  const aiApiLabel = active ? AI_API_PROVIDER_CONFIG[active].label : "Off";

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
    aiApiProvider,
    aiApiKey,
    aiApiModel,
    aiApiLabel,
    isAiApiActive,
    handleApiProviderChange,
    handleApiKeyChange,
    handleApiModelChange,
  };
};
