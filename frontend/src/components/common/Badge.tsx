import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'blue' | 'purple' | 'sky';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
  glow?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  size = 'md',
  dot = false,
  glow = false,
  className = '',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/90 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/90 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/90 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/90 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
    slate: 'bg-slate-100 text-slate-700 border-slate-200/90 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
  };

  const glowStyles = {
    emerald: 'badge-glow-emerald',
    amber: 'badge-glow-amber',
    rose: 'badge-glow-rose',
    indigo: 'badge-glow',
    blue: 'badge-glow',
    purple: 'badge-glow',
    sky: 'badge-glow',
    slate: '',
  };

  const dotColors = {
    emerald: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
    amber: 'bg-amber-500 shadow-xs shadow-amber-500/50',
    rose: 'bg-rose-500 shadow-xs shadow-rose-500/50',
    indigo: 'bg-indigo-500 shadow-xs shadow-indigo-500/50',
    blue: 'bg-blue-500 shadow-xs shadow-blue-500/50',
    purple: 'bg-purple-500 shadow-xs shadow-purple-500/50',
    sky: 'bg-sky-500 shadow-xs shadow-sky-500/50',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.25 text-[9px] font-black tracking-tight',
    sm: 'px-2 py-0.5 text-[10px] font-extrabold tracking-tight',
    md: 'px-2.5 py-0.75 text-[11px] font-extrabold tracking-tight',
    lg: 'px-3.5 py-1 text-xs font-black tracking-tight',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-sans transition-all duration-200 select-none ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${glow ? glowStyles[variant] : ''} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
