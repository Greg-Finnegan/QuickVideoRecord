import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import BrowserToolbarVisual from "./BrowserToolbarVisual";

const EmptyRecordingsState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-16 px-5">
      <div className="flex justify-center mb-8">
        <BrowserToolbarVisual />
      </div>

      <h2 className="m-0 mb-2 text-xl font-medium text-slate-900 dark:text-slate-100">
        No recordings yet
      </h2>
      <p className="m-0 text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
        Click the extension icon in your toolbar to open the side panel and start
        recording.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Button
          variant="primary"
          rounded="full"
          onClick={() => chrome.runtime.sendMessage({ action: "openSidePanel" })}
        >
          Open Side Panel
        </Button>
        <Button
          variant="secondary"
          rounded="full"
          onClick={() => navigate("/settings")}
        >
          Go to Settings
        </Button>
      </div>
    </div>
  );
};

export default EmptyRecordingsState;
