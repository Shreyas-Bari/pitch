import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Dialog({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = '',
}) {
  const dialogRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        aria-describedby={description ? 'dialog-description' : undefined}
        className={`relative w-full rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden transform transition-all z-10 my-8 ${
          sizeClasses[size] || sizeClasses.md
        } ${className}`}
      >
        {/* Header if title is provided */}
        {(title || onClose) && (
          <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h2
                  id="dialog-title"
                  className="text-lg font-bold text-pitch-text font-display tracking-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id="dialog-description" className="text-sm text-pitch-muted mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 -mr-1 -mt-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function DialogFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Dialog;
