import React from 'react';

export function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`rounded-2xl border border-slate-200/90 bg-white shadow-pitch-card transition-all duration-200 ${
        glass ? 'glass-card' : ''
      } ${hover ? 'hover:shadow-pitch-hover hover:border-slate-300' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-5 border-b border-slate-100 flex flex-col gap-1.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component
      className={`text-lg font-bold text-pitch-text font-display tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-sm text-pitch-muted leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 bg-slate-50/60 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
