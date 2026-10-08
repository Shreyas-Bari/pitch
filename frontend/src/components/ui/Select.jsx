import React, { forwardRef } from 'react';
import Label from './Label';

export const Select = forwardRef(function Select(
  {
    id,
    name,
    label,
    options = [],
    placeholder = 'Select an option',
    error,
    helperText,
    required = false,
    disabled = false,
    children,
    className = '',
    ...props
  },
  ref
) {
  const selectId = id || name || `select-${Math.random().toString(36).substring(2, 7)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText ? `${selectId}-helper` : undefined;

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || helperId}
          required={required}
          className={`w-full appearance-none rounded-lg bg-white border text-sm text-pitch-text transition-colors py-2.5 px-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-pitch-blue focus:border-transparent ${
            error
              ? 'border-pitch-error focus:ring-pitch-error/20 bg-red-50/20'
              : 'border-pitch-outline-variant hover:border-slate-400'
          } ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {children ||
            options.map((opt) => {
              const value = typeof opt === 'object' ? opt.value : opt;
              const labelText = typeof opt === 'object' ? opt.label : opt;
              const isOptDisabled = typeof opt === 'object' ? opt.disabled : false;

              return (
                <option key={value} value={value} disabled={isOptDisabled}>
                  {labelText}
                </option>
              );
            })}
        </select>

        {/* Custom Chevron Down Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

export default Select;
