import React from "react";
import Button from "../../../components/Button";
import { DEFAULT_CHATGPT_PROMPT } from "../../../types";

interface ChatGptPromptSettingProps {
  prompt: string;
  onPromptChange: (value: string) => void;
}

const ChatGptPromptSetting: React.FC<ChatGptPromptSettingProps> = ({
  prompt,
  onPromptChange,
}) => {
  const isDefault = prompt === DEFAULT_CHATGPT_PROMPT;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
        ChatGPT Prompt
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        This prompt is prepended to your transcript when opening in ChatGPT.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        placeholder="Enter your ChatGPT prompt..."
      />
      {!isDefault && (
        <div className="mt-2">
          <Button
            variant="secondary"
            rounded="full"
            onClick={() => onPromptChange(DEFAULT_CHATGPT_PROMPT)}
          >
            Reset to Default
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatGptPromptSetting;
