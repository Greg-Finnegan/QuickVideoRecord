import React from "react";

interface SettingsCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <section className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {description}
        </p>
      )}
      {children}
    </section>
  );
};

export default SettingsCard;
