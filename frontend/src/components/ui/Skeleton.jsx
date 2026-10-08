import React from 'react';

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
}) {
  const baseClasses = 'animate-pulse bg-slate-200/80 rounded';

  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'h-48 w-full rounded-2xl',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`${baseClasses} ${variantClasses[variant] || ''} ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 p-5 space-y-4 bg-white">
      <Skeleton variant="card" height="180px" />
      <Skeleton variant="text" width="60%" height="20px" />
      <div className="space-y-2">
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="75%" />
      </div>
      <div className="pt-2 flex items-center justify-between">
        <Skeleton variant="text" width="30%" height="16px" />
        <Skeleton variant="rectangular" width="80px" height="32px" />
      </div>
    </div>
  );
}

export default Skeleton;
