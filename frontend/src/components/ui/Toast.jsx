import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
};

const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-blue-200 bg-blue-50 text-blue-950',
};

export function ToastItem({ toast, onDismiss }) {
  const { id, type = 'info', title, message } = toast;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-pitch-dropdown glass-card transition-all duration-300 max-w-sm w-full ${
        styles[type] || styles.info
      }`}
    >
      <div className="pt-0.5">{icons[type] || icons.info}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold tracking-tight">{title}</h4>}
        {message && <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default ToastContainer;
