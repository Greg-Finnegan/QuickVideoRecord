import React, { useState } from "react";
import Button from "../../../components/Button";
import Icon from "../../../components/Icon";
import ToastContainer from "../../../components/ToastContainer";
import { useToast } from "../../../hooks/useToast";
import { AI_API_PROVIDER_CONFIG } from "../../../types";
import { generateTicketDraft } from "../../../utils/aiApi";
import type { ActiveAiApiProvider, AiApiProvider } from "../../../types";

interface AiApiSettingProps {
  provider: AiApiProvider;
  apiKey: string;
  model: string;
  label: string;
  onProviderChange: (value: AiApiProvider) => void;
  onApiKeyChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

const providers: AiApiProvider[] = ["off", ...(Object.keys(AI_API_PROVIDER_CONFIG) as ActiveAiApiProvider[])];

// Must run inside a click/keypress handler (Chrome requires a user gesture)
const requestAccess = (p: ActiveAiApiProvider) =>
  chrome.permissions.request({ origins: [AI_API_PROVIDER_CONFIG[p].origin] });

const AiApiSetting: React.FC<AiApiSettingProps> = ({
  provider,
  apiKey,
  model,
  label,
  onProviderChange,
  onApiKeyChange,
  onModelChange,
}) => {
  const [draftKey, setDraftKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const { toasts, removeToast, success } = useToast();

  const accessDenied = (p: ActiveAiApiProvider) =>
    setTestError(`Permission to reach ${AI_API_PROVIDER_CONFIG[p].label} is required to use this key.`);

  const handleTest = async () => {
    if (provider === "off") return;
    setTestError(null);
    setTesting(true);
    try {
      await generateTicketDraft(
        {
          provider,
          apiKey,
          model: model.trim() || AI_API_PROVIDER_CONFIG[provider].defaultModel,
          prompt: "This is a connection test. Make a short ticket for the transcript.",
        },
        "Test: the save button does nothing when clicked."
      );
      success(`${label} connected.`);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const saveDraftKey = async () => {
    if (provider === "off" || !draftKey.trim()) return;
    setTestError(null);
    try {
      if (!(await requestAccess(provider))) return accessDenied(provider);
    } catch (err) {
      // e.g. the loaded manifest predates optional_host_permissions (reload the extension)
      return setTestError(err instanceof Error ? err.message : "Permission request failed");
    }
    onApiKeyChange(draftKey.trim());
    setDraftKey("");
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
        Automatic Ticket Drafts (API Key)
      </label>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        After transcription, send the transcript and your AI Prompt to this
        provider to name the recording and pre-fill the Jira ticket draft.
        Replaces Chrome's built-in AI for filenames.
      </p>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <Button
            key={p}
            variant={provider === p ? "primary" : "secondary"}
            rounded="full"
            className="!px-4 !py-2"
            onClick={() => onProviderChange(p)}
          >
            {p === "off" ? "Off" : AI_API_PROVIDER_CONFIG[p].label}
          </Button>
        ))}
      </div>
      {provider !== "off" && (
        <div className="mt-4">
          {apiKey ? (
            <div className="flex items-center gap-3">
              <code className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                {apiKey.slice(0, 5)}••••••
              </code>
              <div className="flex items-center gap-1">
              <Button variant="ghost" rounded="full" onClick={() => { onApiKeyChange(""); setTestError(null); }}>
                <span className="flex items-center gap-2">
                  <Icon name="refresh" size={16} />
                  Replace Key
                </span>
              </Button>
              <Button variant="ghost" rounded="full" onClick={handleTest} disabled={testing}>
                <span className="flex items-center gap-2">
                  <Icon name="zap" size={16} />
                  {testing ? "Testing..." : "Test"}
                </span>
              </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveDraftKey()}
              placeholder={`Paste your ${label} API key`}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {draftKey.trim() && (
              <Button variant="primary" rounded="full" onClick={saveDraftKey}>
                <span className="flex items-center gap-2">
                  <Icon name="check" size={16} />
                  Save
                </span>
              </Button>
            )}
            </div>
          )}
          {testError && (
            <p className="text-sm mt-2 text-red-600 dark:text-red-400">{testError}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Stored locally in this browser only. Usage is billed to your{" "}
            {label} account.
          </p>
          <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mt-4 mb-1">
            {provider === "openrouter" ? "Model ID" : "Model"}
          </label>
          <input
            type="text"
            spellCheck={false}
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder={AI_API_PROVIDER_CONFIG[provider].defaultModel}
            className="w-full max-w-md px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {provider === "openrouter"
              ? "Any OpenRouter model ID, e.g. anthropic/claude-haiku-5-5. "
              : ""}
            Leave empty to use the default ({AI_API_PROVIDER_CONFIG[provider].defaultModel}).
          </p>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default AiApiSetting;
