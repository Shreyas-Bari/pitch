import React from 'react';
import Spinner from './Spinner';

export function PageLoading({ message = 'Loading PITCH...', fullScreen = true }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-6 bg-pitch-canvas ${
        fullScreen ? 'min-h-screen fixed inset-0 z-50' : 'min-h-[400px] w-full'
      }`}
    >
      <div className="relative mb-5">
        <div className="w-14 h-14 rounded-2xl bg-pitch-navy text-white flex items-center justify-center shadow-lg border border-slate-700 font-display font-black text-2xl tracking-tight">
          P
        </div>
        <div className="absolute -bottom-1 -right-1">
          <Spinner size="md" color="primary" />
        </div>
      </div>

      <p className="text-sm font-semibold text-pitch-text font-display">
        {message}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Please wait a moment
      </p>
    </div>
  );
}

export default PageLoading;
