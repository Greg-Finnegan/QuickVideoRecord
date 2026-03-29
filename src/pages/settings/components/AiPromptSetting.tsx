import React from "react";
import Button from "../../../components/Button";
import { DEFAULT_AI_PROMPT } from "../../../types";

interface AiPromptSettingProps {
  prompt: string;
  onPromptChange: (value: string) => void;
}

const AiPromptSetting: React.FC<AiPromptSettingProps> = ({
  prompt,
  onPromptChange,
}) => {
  const isDefault = prompt === DEFAULT_AI_PROMPT;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
        AI Prompt
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        This prompt is prepended to your transcript when opening in your
        selected AI provider.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        placeholder="Enter your AI prompt..."
      />
      {!isDefault && (
        <div className="mt-2">
          <Button
            variant="secondary"
            rounded="full"
            onClick={() => onPromptChange(DEFAULT_AI_PROMPT)}
          >
            Reset to Default
          </Button>
        </div>
      )}
    </div>
  );
};

export default AiPromptSetting;
