import React from 'react';

const variants = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-pitch-navy text-white border-transparent',
  secondary: 'bg-pitch-surface-1 text-pitch-blue border-pitch-surface-2',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  outline: 'bg-transparent text-pitch-muted border-pitch-outline-variant',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs font-medium gap-1',
  md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
  lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
};

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border transition-colors select-none ${
        variants[variant] || variants.neutral
      } ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
