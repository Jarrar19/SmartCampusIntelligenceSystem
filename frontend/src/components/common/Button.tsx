import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'emerald' | 'amber' | 'sky';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-extrabold tracking-tight rounded-2xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 select-none';

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-[11px] gap-1 rounded-xl',
    sm: 'px-3.5 py-1.5 text-xs gap-1.5 rounded-xl',
    md: 'px-4.5 py-2.5 text-xs sm:text-sm gap-2 rounded-2xl',
    lg: 'px-6 py-3.5 text-sm sm:text-base gap-2.5 rounded-2xl shadow-lg',
  };

  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/25 border border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/30 focus-visible:ring-brand-500',
    secondary: 'bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 focus-visible:ring-slate-400',
    outline: 'bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 focus-visible:ring-slate-400',
    ghost: 'bg-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-transparent focus-visible:ring-slate-400',
    destructive: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-500/25 border border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/30 focus-visible:ring-rose-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25 border border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/30 focus-visible:ring-emerald-500',
    amber: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/25 border border-amber-400/30 focus-visible:ring-amber-500',
    sky: 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-500/25 border border-sky-500/30 focus-visible:ring-sky-500',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
      {!isLoading && leftIcon && <span className="flex-shrink-0 flex items-center">{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0 flex items-center">{rightIcon}</span>}
    </button>
  );
};
