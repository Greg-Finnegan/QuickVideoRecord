import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import BrowserToolbarVisual from "./BrowserToolbarVisual";

interface EmptyRecordingsStateProps {
  variant?: "empty" | "few";
}

const EmptyRecordingsState: React.FC<EmptyRecordingsStateProps> = ({
  variant = "empty",
}) => {
  const navigate = useNavigate();

  const isEmpty = variant === "empty";

  return (
    <div className={`text-center px-5 ${isEmpty ? "py-16" : "py-10"}`}>
      {isEmpty && (
        <div className="flex justify-center mb-8">
          <BrowserToolbarVisual />
        </div>
      )}

      <h2 className="m-0 mb-2 text-xl font-medium text-slate-900 dark:text-slate-100">
        {isEmpty ? "No recordings yet" : "Ready to record more?"}
      </h2>
      <p className="m-0 text-sm dark:text-slate-400 mx-auto">
        {isEmpty
          ? "Click the extension icon in your toolbar to open the side panel and start recording."
          : "Open the side panel to capture your next screen recording."}
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Button
          variant="primary"
          rounded="full"
          onClick={() => chrome.runtime.sendMessage({ action: "openSidePanel" })}
          className="flex items-center gap-2"
        >
          Open Side Panel
          <Icon name="arrow-right" size={16} />
        </Button>
        {isEmpty && (
          <Button
            variant="secondary"
            rounded="full"
            onClick={() => navigate("/settings")}
          >
            Go to Settings
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyRecordingsState;
