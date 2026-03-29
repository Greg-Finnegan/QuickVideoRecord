import React from "react";
import Button from "../../../components/Button";
import { AI_PROVIDER_CONFIG } from "../../../types";
import type { AiProvider } from "../../../types";

interface AiProviderSettingProps {
  provider: AiProvider;
  onProviderChange: (value: AiProvider) => void;
}

const providers: { value: AiProvider; label: string }[] = (
  Object.keys(AI_PROVIDER_CONFIG) as AiProvider[]
).map((key) => ({
  value: key,
  label: AI_PROVIDER_CONFIG[key].label,
}));

const AiProviderSetting: React.FC<AiProviderSettingProps> = ({
  provider,
  onProviderChange,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
        AI Provider
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Choose which AI assistant to send your transcripts to.
      </p>
      <div className="flex gap-2">
        {providers.map((p) => (
          <Button
            key={p.value}
            variant={provider === p.value ? "primary" : "secondary"}
            rounded="full"
            className="!px-4 !py-2"
            onClick={() => onProviderChange(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      {AI_PROVIDER_CONFIG[provider].clipboardOnly && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            {AI_PROVIDER_CONFIG[provider].label} does not support pre-filling
            the chat via URL. When you use "Copy & Open {AI_PROVIDER_CONFIG[provider].label}", the prompt and
            transcript will be copied to your clipboard and a new chat will be
            opened — you'll need to paste it manually.
          </p>
        </div>
      )}
    </div>
  );
};

export default AiProviderSetting;
