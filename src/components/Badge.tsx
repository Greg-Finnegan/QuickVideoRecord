import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, className = '' }) => {
  const baseStyles = 'px-2 py-1.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-[11px] text-center text-slate-600 dark:text-slate-400 font-medium';

  return (
    <div className={`${baseStyles} ${className}`}>
      {children}
    </div>
  );
};

export default Badge;
