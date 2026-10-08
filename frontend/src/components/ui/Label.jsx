import React from 'react';

export function Label({
  htmlFor,
  children,
  required = false,
  className = '',
  ...props
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-semibold uppercase tracking-wider text-pitch-muted mb-1.5 select-none ${className}`}
      {...props}
    >
      {children}
      {required && (
        <span className="text-pitch-error ml-1 font-bold" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export default Label;
