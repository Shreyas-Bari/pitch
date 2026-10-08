import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

export const Checkbox = forwardRef(function Checkbox(
  {
    id,
    name,
    label,
    description,
    error,
    checked,
    onChange,
    disabled = false,
    className = '',
    ...props
  },
  ref
) {
  const checkboxId = id || name || `checkbox-${Math.random().toString(36).substring(2, 7)}`;
  const errorId = error ? `${checkboxId}-error` : undefined;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="flex items-center h-5 mt-0.5">
        <input
          ref={ref}
          id={checkboxId}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="peer sr-only"
          {...props}
        />
        <label
          htmlFor={checkboxId}
          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-pitch-blue peer-focus-visible:ring-offset-2 ${
            error
              ? 'border-pitch-error'
              : 'border-slate-300 peer-checked:bg-pitch-blue peer-checked:border-pitch-blue'
          } ${disabled ? 'bg-slate-100 border-slate-200 cursor-not-allowed' : 'bg-white'}`}
        >
          <Check className="w-3 h-3 text-white stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
        </label>
      </div>

      {(label || description || error) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={checkboxId}
              className={`text-sm font-medium text-pitch-text select-none cursor-pointer ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-pitch-muted mt-0.5 leading-relaxed">{description}</p>
          )}
          {error && (
            <p id={errorId} role="alert" className="text-xs text-pitch-error font-medium mt-1">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default Checkbox;
