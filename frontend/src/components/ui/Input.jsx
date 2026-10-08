import React, { forwardRef } from 'react';
import Label from './Label';

export const Input = forwardRef(function Input(
  {
    id,
    name,
    type = 'text',
    label,
    error,
    helperText,
    required = false,
    leftIcon,
    rightIcon,
    disabled = false,
    className = '',
    placeholder,
    ...props
  },
  ref
) {
  const inputId = id || name || `input-${Math.random().toString(36).substring(2, 7)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || helperId}
          required={required}
          className={`w-full rounded-lg bg-white border text-sm text-pitch-text placeholder-slate-400 transition-colors py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-pitch-blue focus:border-transparent ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-pitch-error focus:ring-pitch-error/20 bg-red-50/20'
              : 'border-pitch-outline-variant hover:border-slate-400'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-pitch-error font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
