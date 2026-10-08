import React, { useState, useRef, useEffect } from 'react';

export function Dropdown({
  trigger,
  items = [],
  align = 'right',
  className = '',
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <div onClick={toggle} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute z-50 mt-2 min-w-[200px] rounded-xl bg-white p-1.5 shadow-pitch-dropdown border border-slate-200 glass-card animate-in fade-in-0 zoom-in-95 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children ||
            items.map((item, idx) => {
              if (item.divider) {
                return <div key={`div-${idx}`} className="my-1 border-t border-slate-100" />;
              }

              const isDanger = item.variant === 'danger';

              return (
                <button
                  key={item.label || idx}
                  role="menuitem"
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    item.onClick?.(e);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-left transition-colors font-medium ${
                    isDanger
                      ? 'text-pitch-error hover:bg-red-50'
                      : 'text-pitch-text hover:bg-slate-100'
                  } ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {item.icon && <span className="w-4 h-4 shrink-0 text-slate-400">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
