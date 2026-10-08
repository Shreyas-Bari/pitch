import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/ui/Toast';

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      const newToast = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const toast = useCallback(
    (options) => {
      if (typeof options === 'string') {
        return addToast({ message: options });
      }
      return addToast(options);
    },
    [addToast]
  );

  toast.success = (message, title = 'Success') =>
    addToast({ type: 'success', title, message });
  toast.error = (message, title = 'Error') =>
    addToast({ type: 'error', title, message });
  toast.warning = (message, title = 'Warning') =>
    addToast({ type: 'warning', title, message });
  toast.info = (message, title = 'Information') =>
    addToast({ type: 'info', title, message });
  toast.dismiss = dismiss;

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
