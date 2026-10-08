import React, { forwardRef } from 'react';
import Label from './Label';

export const Textarea = forwardRef(function Textarea(
  {
    id,
    name,
    label,
    error,
    helperText,
    required = false,
    rows = 4,
    disabled = false,
    className = '',
    placeholder,
    ...props
  },
  ref
) {
  const textareaId = id || name || `textarea-${Math.random().toString(36).substring(2, 7)}`;
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = helperText ? `${textareaId}-helper` : undefined;

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={textareaId} required={required}>
          {label}
        </Label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId || helperId}
        required={required}
        className={`w-full rounded-lg bg-white border text-sm text-pitch-text placeholder-slate-400 transition-colors py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-pitch-blue focus:border-transparent ${
          error
            ? 'border-pitch-error focus:ring-pitch-error/20 bg-red-50/20'
            : 'border-pitch-outline-variant hover:border-slate-400'
        } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${className}`}
        {...props}
      />

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

export default Textarea;
