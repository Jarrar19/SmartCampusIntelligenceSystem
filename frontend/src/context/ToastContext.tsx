import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
          container: 'border-emerald-200 bg-white dark:bg-slate-900 dark:border-emerald-500/40 text-slate-800 dark:text-slate-100',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
          container: 'border-rose-200 bg-white dark:bg-slate-900 dark:border-rose-500/40 text-slate-800 dark:text-slate-100',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
          container: 'border-amber-200 bg-white dark:bg-slate-900 dark:border-amber-500/40 text-slate-800 dark:text-slate-100',
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />,
          container: 'border-indigo-200 bg-white dark:bg-slate-900 dark:border-indigo-500/40 text-slate-800 dark:text-slate-100',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none px-4">
        {toasts.map((t) => {
          const { icon, container } = getToastStyles(t.type);
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start justify-between p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-0 ${container}`}
            >
              <div className="flex items-start space-x-3">
                {icon}
                <p className="text-xs sm:text-sm font-semibold leading-5 pt-0.5">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-3 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
