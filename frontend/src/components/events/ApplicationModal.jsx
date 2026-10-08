import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogFooter } from '../ui/Dialog';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import { applicationService } from '../../services';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatCurrency';

export function ApplicationModal({
  isOpen,
  onClose,
  event,
  packages = [],
  initialPackage = null,
  onSuccess = null,
}) {
  const toast = useToast();
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackage?._id || '');
  const [message, setMessage] = useState('');
  const [customCashAmount, setCustomCashAmount] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!event) return null;

  const packageOptions = [
    { value: '', label: 'General Application (Custom Proposal)' },
    ...packages.map((p) => ({
      value: p._id,
      label: `${p.title} (${p.cashRequirement?.amount ? formatCurrency(p.cashRequirement.amount) : 'In-Kind'})`,
    })),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a short pitch or introduction for the student committee.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        message: message.trim(),
        packageId: selectedPackageId || undefined,
        proposedContribution: customCashAmount ? {
          types: ['CASH'],
          cashAmount: Number(customCashAmount) || undefined,
        } : undefined,
        customTerms: contactName ? `Contact Person: ${contactName} (${contactEmail})` : undefined,
      };

      await applicationService.applyToEvent(event._id, payload);
      toast.success('Sponsorship application submitted! The committee will review your proposal.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to submit application';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply to Sponsor: ${event.title}`}
      description="Submit your initial sponsorship interest to the student committee. Terms and deliverables are finalized through PITCH negotiation."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-pitch-text mb-1.5">
            Select Sponsorship Tier (Optional)
          </label>
          <Select
            options={packageOptions}
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
          />
          <p className="text-[11px] text-pitch-muted mt-1">
            You can select a pre-defined package or initiate custom contribution discussions.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-pitch-text mb-1.5">
            Proposed Sponsorship Value (INR)
          </label>
          <Input
            type="number"
            placeholder="e.g. 50000"
            value={customCashAmount}
            onChange={(e) => setCustomCashAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-pitch-text mb-1.5">
            Pitch / Brand Partnership Message *
          </label>
          <Textarea
            rows={4}
            required
            placeholder="Introduce your brand and outline what you would like to achieve with this fest sponsorship..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-pitch-text mb-1.5">
              Contact Representative
            </label>
            <Input
              placeholder="Your name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-pitch-text mb-1.5">
              Contact Email
            </label>
            <Input
              type="email"
              placeholder="sponsor@brand.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Submit Application
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default ApplicationModal;
