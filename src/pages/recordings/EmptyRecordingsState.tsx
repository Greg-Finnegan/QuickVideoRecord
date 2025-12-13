import React from "react";
import Icon from "../../components/Icon";

/**
 * Empty state component displayed when there are no recordings
 */
const EmptyRecordingsState: React.FC = () => {
  return (
    <div className="text-center py-20 px-5">
      <div className="text-slate-600 dark:text-slate-400 mb-4 flex justify-center">
        <Icon name="video" size={64} />
      </div>
      <h2 className="m-0 mb-2 text-xl font-medium text-slate-900 dark:text-slate-100">
        No recordings yet
      </h2>
      <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
        Your recording history will appear here after you create your first
        recording.
      </p>
    </div>
  );
};

export default EmptyRecordingsState;
