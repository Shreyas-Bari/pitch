import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Drawer({
  isOpen = false,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  className = '',
}) {
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

  const widthClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
    xl: 'max-w-xl',
  };

  const isLeft = position === 'left';

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`fixed inset-y-0 flex max-w-full ${isLeft ? 'left-0 pr-10' : 'right-0 pl-10'}`}>
        <div
          role="dialog"
          aria-modal="true"
          className={`w-screen ${widthClasses[size] || widthClasses.md} bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 ${className}`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            {title && (
              <h2 className="text-base font-bold text-pitch-text font-display">
                {title}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 -mr-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Drawer;
