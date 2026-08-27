import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  errorText,
  leftIcon,
  rightIcon,
  isRequired = false,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-black text-slate-700 dark:text-slate-200 tracking-tight"
        >
          {label} {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`w-full glass-input rounded-2xl text-xs sm:text-sm font-medium px-4 py-2.5 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            errorText ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-slate-400 dark:text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>

      {errorText ? (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 mt-1 animate-fade-in-up">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorText}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
