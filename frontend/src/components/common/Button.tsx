import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'emerald' | 'amber' | 'sky' | 'glass' | 'saffron' | 'navy' | 'tricolor';
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
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 select-none';

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-[11px] gap-1 rounded-lg',
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2 rounded-xl shadow-xs',
  };

  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-xs border border-brand-500/30 focus-visible:ring-brand-500',
    saffron: 'bg-orange-600 hover:bg-orange-500 text-white shadow-xs border border-orange-500/30 focus-visible:ring-orange-500',
    navy: 'bg-blue-800 hover:bg-blue-700 text-white shadow-xs border border-blue-700/30 focus-visible:ring-blue-700',
    tricolor: 'bg-gradient-to-r from-orange-600 via-blue-600 to-emerald-600 hover:from-orange-500 hover:to-emerald-500 text-white shadow-xs border border-orange-400/30 focus-visible:ring-orange-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400',
    outline: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 focus-visible:ring-slate-400',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-transparent focus-visible:ring-slate-400',
    destructive: 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs border border-rose-500/30 focus-visible:ring-rose-500',
    emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs border border-emerald-500/30 focus-visible:ring-emerald-500',
    amber: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-xs border border-amber-400/30 focus-visible:ring-amber-500',
    sky: 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs border border-sky-500/30 focus-visible:ring-sky-500',
    glass: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 shadow-xs focus-visible:ring-brand-500',
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
