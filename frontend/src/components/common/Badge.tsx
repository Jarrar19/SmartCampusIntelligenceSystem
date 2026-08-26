import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'blue' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/90 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
    slate: 'bg-slate-100 text-slate-700 border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
  };

  const dotColors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-bold tracking-tight',
    md: 'px-2.5 py-0.75 text-[11px] font-bold tracking-tight',
    lg: 'px-3 py-1 text-xs font-bold tracking-tight',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-sans transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
