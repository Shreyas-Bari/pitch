import React from 'react';
import Dialog, { DialogFooter } from './Dialog';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export function ConfirmationDialog({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
}) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            confirmVariant === 'danger'
              ? 'bg-red-100 text-red-600'
              : 'bg-blue-100 text-pitch-blue'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-base font-bold text-pitch-text font-display">
            {title}
          </h3>
          <p className="text-sm text-pitch-muted mt-1.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <DialogFooter className="mt-6 -mx-6 -mb-6">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={onClose}
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmVariant}
          size="sm"
          isLoading={isLoading}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default ConfirmationDialog;
