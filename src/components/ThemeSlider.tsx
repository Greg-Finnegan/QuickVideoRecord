import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export type ThemeOption = "light" | "dark" | "system";

interface ThemeSliderProps {
  value: ThemeOption;
  onChange: (value: ThemeOption) => void;
}

const ThemeSlider: React.FC<ThemeSliderProps> = ({ value, onChange }) => {
  const options: { value: ThemeOption; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun size={16} /> },
    { value: "dark", label: "Dark", icon: <Moon size={16} /> },
    { value: "system", label: "System", icon: <Monitor size={16} /> },
  ];

  return (
    <div className="inline-flex bg-slate-100 dark:bg-slate-700 rounded-full p-1 gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2
            ${
              value === option.value
                ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }
          `}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeSlider;
