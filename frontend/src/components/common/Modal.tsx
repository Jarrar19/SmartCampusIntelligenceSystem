import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-200 animate-fade-in-up"
        onClick={onClose}
      />

      {/* Dialog Container */}
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 text-center">
        <div
          className={`relative transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 text-left shadow-2xl shadow-slate-950/30 transition-all sm:my-8 w-full ${maxWidthClasses[maxWidth]} border border-slate-200/90 dark:border-slate-800 animate-fade-in-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-4.5 bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md">
            <div>
              <h3 id="modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h3>
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-2xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5.5 max-h-[82vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};
