import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Dialog, { DialogFooter } from '../ui/Dialog';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { dealService } from '../../services/dealService';
import { useToast } from '../../hooks/useToast';

export function DisputeModal({ isOpen, onClose, dealId, onDisputeRaised }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Reason must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await dealService.raiseDispute(dealId, {
        reason: reason.trim(),
        description: description.trim(),
      });
      toast.warning('Dispute recorded. Deal marked as DISPUTED.');
      if (onDisputeRaised) onDisputeRaised();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to raise dispute.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Raise a Formal Dispute"
      description="Report an unresolved contractual, fulfillment, or commercial breach on this deal."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Raising a dispute pauses normal fulfillment workflows and records a formal issue record. Both parties must negotiate or resolve before deal completion.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Dispute Reason (Summary)
          </label>
          <Input
            type="text"
            placeholder="e.g. Failure to deliver agreed branding banners"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Description & Evidence Context
          </label>
          <textarea
            rows={4}
            placeholder="Provide specific details of the breach, dates, communications, and expectations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:border-red-500 leading-relaxed"
            required
          />
        </div>

        <DialogFooter className="-mx-6 -mb-6 mt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            isLoading={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Submit Dispute
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default DisputeModal;
