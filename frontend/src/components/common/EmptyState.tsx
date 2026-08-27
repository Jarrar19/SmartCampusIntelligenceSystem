import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl shadow-xs my-4 animate-fade-in-up">
      <div className="flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-brand-500/10 border border-indigo-100 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 mb-4 shadow-sm">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1.5 tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed font-medium">
        {description}
      </p>
      
      {(actionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryActionText && onSecondaryAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </Button>
          )}
          {actionText && onAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
            >
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
