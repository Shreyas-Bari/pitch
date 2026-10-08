import React from 'react';

export function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-pitch-blue',
      border: 'border-blue-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="text-2xl font-display font-bold text-slate-900 mt-1">{value ?? '—'}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">{subtitle}</p>
        )}
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text} border ${style.border}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}

export default StatsCard;
