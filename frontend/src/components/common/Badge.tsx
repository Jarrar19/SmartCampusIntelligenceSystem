import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate' | 'blue' | 'purple' | 'sky' | 'saffron' | 'orange' | 'navy' | 'tricolor';
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
    saffron: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800/80',
    orange: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800/80',
    navy: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
    tricolor: 'bg-gradient-to-r from-orange-50 via-white to-emerald-50 text-slate-800 border-orange-200/80 dark:from-orange-950/50 dark:via-blue-950/50 dark:to-emerald-950/50 dark:text-slate-200 dark:border-orange-800/50',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
    rose: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/80',
    blue: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/80',
    sky: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const glowStyles = {
    saffron: 'badge-glow-amber',
    orange: 'badge-glow-amber',
    navy: '',
    tricolor: '',
    emerald: 'badge-glow-emerald',
    amber: 'badge-glow-amber',
    rose: 'badge-glow-rose',
    indigo: '',
    blue: '',
    purple: '',
    sky: '',
    slate: '',
  };

  const dotColors = {
    saffron: 'bg-orange-500 shadow-xs shadow-orange-500/50',
    orange: 'bg-orange-500 shadow-xs shadow-orange-500/50',
    navy: 'bg-blue-700 shadow-xs shadow-blue-700/50',
    tricolor: 'bg-orange-500',
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
