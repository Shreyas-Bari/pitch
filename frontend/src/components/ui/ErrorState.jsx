import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, ShieldAlert, WifiOff } from 'lucide-react';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

const defaultErrorDetails = {
  network: {
    icon: WifiOff,
    title: 'Connection Lost',
    message: 'Unable to communicate with the PITCH server. Please check your internet connection.',
  },
  unauthorized: {
    icon: ShieldAlert,
    title: 'Authentication Required',
    message: 'Please sign in to access this resource or feature.',
  },
  forbidden: {
    icon: ShieldAlert,
    title: 'Access Restricted',
    message: 'You do not have permission to view this section with your current account role.',
  },
  notfound: {
    icon: AlertCircle,
    title: 'Resource Not Found',
    message: 'The requested resource could not be found or may have been removed.',
  },
  api: {
    icon: AlertCircle,
    title: 'Server Error',
    message: 'An unexpected error occurred while processing your request. Please try again.',
  },
};

export function ErrorState({
  type = 'api',
  title,
  message,
  onRetry,
  backUrl,
  action,
  className = '',
}) {
  const navigate = useNavigate();
  const defaults = defaultErrorDetails[type] || defaultErrorDetails.api;
  const Icon = defaults.icon;

  const displayTitle = title || defaults.title;
  const displayMessage = message || defaults.message;

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-red-200/80 bg-red-50/40 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-white border border-red-100 shadow-sm flex items-center justify-center text-pitch-error mb-4">
        <Icon className="w-7 h-7 text-red-600" />
      </div>

      <h3 className="text-base font-bold text-pitch-text font-display mb-1.5">
        {displayTitle}
      </h3>

      <p className="text-sm text-pitch-muted max-w-md mb-6 leading-relaxed">
        {displayMessage}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </Button>
        )}

        {backUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backUrl)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
        )}

        {action}
      </div>
    </div>
  );
}

export default ErrorState;
