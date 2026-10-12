import React from "react";
import Icon from "../../components/Icon";

interface MicSelectProps {
  devices: MediaDeviceInfo[];
  value: string;
  onChange: (deviceId: string) => void;
  disabled?: boolean;
}

const MicSelect: React.FC<MicSelectProps> = ({ devices, value, onChange, disabled }) => {
  // Before mic permission, Chrome returns devices with empty ids/labels
  const listed = devices.filter((d) => d.deviceId);

  return (
    <div className="relative flex-1 min-w-0">
      <select
        aria-label="Microphone"
        className="w-full appearance-none px-3 py-2.5 pr-8 text-sm font-medium truncate bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        value={value || "default"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {listed.length ? (
          listed.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {/* Drop Chrome's USB vendor:product suffix, e.g. " (046d:08e5)" */}
              {d.label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)$/i, "") || "Microphone"}
            </option>
          ))
        ) : (
          <option value="default">Default microphone</option>
        )}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
        <Icon name="chevron-down" size={16} />
      </div>
    </div>
  );
};

export default MicSelect;
