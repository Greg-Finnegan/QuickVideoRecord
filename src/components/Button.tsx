import React from 'react';

type ButtonVariant = 'primary' | 'warning' | 'secondary' | 'ghost' | 'success' | 'error';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  fullWidth?: boolean;
  rounded?: 'default' | 'full';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  fullWidth = false,
  rounded = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'px-6 py-3 text-sm font-medium cursor-pointer border-none transition-all flex items-center justify-center gap-2';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:bg-blue-800 dark:active:bg-blue-700',
    warning: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 active:bg-red-800 dark:active:bg-red-700',
    secondary: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 active:bg-slate-200 dark:active:bg-slate-500',
    success: 'bg-green-600 dark:bg-green-500 text-white border-green-600 dark:border-green-500 hover:bg-green-700 dark:hover:bg-green-600',
    error: 'bg-red-600 dark:bg-red-500 text-white border-red-600 dark:border-red-500 hover:bg-red-700 dark:hover:bg-red-600',
    ghost: 'bg-transparent border-none text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 active:text-blue-800 dark:active:text-blue-200 p-0'
  };

  const roundedStyles = rounded === 'full' ? 'rounded-full' : 'rounded-md';
  const widthStyles = fullWidth ? 'w-full' : '';
  const disabledStyles = 'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${roundedStyles} ${widthStyles} ${disabledStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
