import React from 'react';
import { FolderSearch } from 'lucide-react';

export function EmptyState({
  icon: Icon = FolderSearch,
  title = 'No items found',
  description = 'There are no items to display at this moment.',
  action,
  children,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 mb-4">
        {React.isValidElement(Icon) ? Icon : <Icon className="w-7 h-7 text-slate-400" />}
      </div>

      <h3 className="text-base font-bold text-pitch-text font-display mb-1.5">
        {title}
      </h3>

      <p className="text-sm text-pitch-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {action && <div>{action}</div>}
      {children}
    </div>
  );
}

export default EmptyState;
