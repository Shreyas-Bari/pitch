import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, Info, Sparkles, Building2 } from 'lucide-react';
import { Dialog, DialogFooter } from '../ui/Dialog';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import { applicationService, packageService } from '../../services';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatCurrency';

export function ApplicationModal({
  isOpen,
  onClose,
  event,
  packages = [],
  initialPackage = null,
  onSuccess = null,
  existingApplication = null,
}) {
  const toast = useToast();
  const { user, profile } = useAuth();

  const [loadedPackages, setLoadedPackages] = useState(Array.isArray(packages) ? packages : []);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackage?._id || initialPackage?.id || '');
  const [message, setMessage] = useState('');
  const [customCashAmount, setCustomCashAmount] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Sync or fetch packages when modal opens
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      return;
    }

    if (Array.isArray(packages) && packages.length > 0) {
      setLoadedPackages(packages);
    } else if (event?._id || event?.id) {
      const eventId = event._id || event.id;
      setLoadingPackages(true);
      packageService.getPackagesByEvent(eventId)
        .then((res) => {
          const list = Array.isArray(res?.data?.packages)
            ? res.data.packages
            : (Array.isArray(res?.data)
              ? res.data
              : (Array.isArray(res?.packages) ? res.packages : []));
          setLoadedPackages(list);
        })
        .catch(() => setLoadedPackages([]))
        .finally(() => setLoadingPackages(false));
    }
  }, [isOpen, packages, event]);

  // Pre-fill contact details from authenticated user session & company profile
  useEffect(() => {
    if (isOpen) {
      if (!contactName) {
        setContactName(user?.name || profile?.companyName || '');
      }
      if (!contactEmail) {
        setContactEmail(profile?.contact?.email || user?.email || '');
      }
    }
  }, [isOpen, user, profile]);

  // Sync selected package when initialPackage or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialPackage?._id || initialPackage?.id) {
        const pkgId = initialPackage._id || initialPackage.id;
        setSelectedPackageId(pkgId);
        if (initialPackage.cashRequirement?.amount) {
          setCustomCashAmount(String(initialPackage.cashRequirement.amount));
        }
      } else if (!selectedPackageId) {
        setSelectedPackageId('');
      }
    }
  }, [isOpen, initialPackage]);

  if (!event) return null;

  // Filter only eligible packages (exclude INACTIVE)
  const eligiblePackages = (loadedPackages || []).filter((p) => {
    if (!p) return false;
    if (p.status === 'INACTIVE') return false;
    return true;
  });

  const packageOptions = [
    { value: '', label: 'General Application (Custom Proposal)' },
    ...eligiblePackages.map((p) => {
      const title = p.title || p.name || 'Package';
      const cashAmount = p.cashRequirement?.amount;
      const amountStr = cashAmount ? formatCurrency(cashAmount) : null;
      const types = Array.isArray(p.contributionTypes) ? p.contributionTypes : [];
      let detail = '';
      if (amountStr && types.length > 0 && types.some((t) => t !== 'CASH')) {
        detail = `${amountStr} + ${types.filter((t) => t !== 'CASH').join(', ')}`;
      } else if (amountStr) {
        detail = amountStr;
      } else if (types.length > 0) {
        detail = types.join(', ');
      } else {
        detail = 'In-Kind';
      }
      return {
        value: p._id || p.id,
        label: `${title} (${detail})`,
      };
    }),
  ];

  const handlePackageChange = (e) => {
    const pkgId = e.target.value;
    setSelectedPackageId(pkgId);
    if (error) setError(null);

    if (pkgId) {
      const selected = eligiblePackages.find((p) => String(p._id || p.id) === String(pkgId));
      if (selected?.cashRequirement?.amount !== undefined && selected?.cashRequirement?.amount !== null) {
        setCustomCashAmount(String(selected.cashRequirement.amount));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate Pitch Message (Required, trimmed)
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError('Please provide a pitch or brand partnership message for the student committee.');
      return;
    }

    // 2. Validate Budget (Optional, but if entered must be non-negative valid number)
    let proposedContribution = undefined;
    if (customCashAmount !== '' && customCashAmount !== null && customCashAmount !== undefined) {
      const parsedAmount = Number(customCashAmount);
      if (isNaN(parsedAmount) || !isFinite(parsedAmount)) {
        setError('Proposed sponsorship value must be a valid numeric amount.');
        return;
      }
      if (parsedAmount < 0) {
        setError('Proposed sponsorship value cannot be negative.');
        return;
      }
      proposedContribution = {
        types: ['CASH'],
        cash: {
          amount: parsedAmount,
          currency: 'INR',
        },
        nonCash: [],
      };
    }

    // 3. Validate Contact Email (if entered)
    const trimmedEmail = contactEmail.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid contact email address.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      // Cleanly append contact information to the message to adhere to strict backend schema
      let finalMessage = trimmedMessage;
      const contactInfo = [];
      if (contactName.trim()) contactInfo.push(`Representative: ${contactName.trim()}`);
      if (trimmedEmail) contactInfo.push(`Email: ${trimmedEmail}`);
      if (contactInfo.length > 0) {
        finalMessage += `\n\n[Contact: ${contactInfo.join(' | ')}]`;
      }

      const payload = {
        message: finalMessage,
        packageId: selectedPackageId || undefined,
        proposedContribution,
      };

      const eventId = event._id || event.id;
      await applicationService.applyToEvent(eventId, payload);

      toast.success('Sponsorship application submitted! The committee will review your proposal.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to submit application';
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
      description="Submit your commercial sponsorship proposal to the student organizing committee. Terms and deliverables are refined through PITCH negotiation."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {existingApplication && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Your company already has an active application for this event ({existingApplication.status}).
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-pitch-text mb-1.5">
            Select Sponsorship Tier (Optional)
          </label>
          <Select
            options={packageOptions}
            value={selectedPackageId}
            onChange={handlePackageChange}
            disabled={loadingPackages}
          />
          {eligiblePackages.length === 0 && !loadingPackages ? (
            <p className="text-[11px] text-pitch-muted mt-1">
              No predefined tiers published for this event. You can submit an open custom proposal.
            </p>
          ) : (
            <p className="text-[11px] text-pitch-muted mt-1">
              Select an established tier, or choose General Application to propose a custom arrangement.
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-pitch-text mb-1.5">
            Proposed Sponsorship Value (INR)
          </label>
          <Input
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 50000 (Optional)"
            value={customCashAmount}
            onChange={(e) => {
              setCustomCashAmount(e.target.value);
              if (error) setError(null);
            }}
          />
          <p className="text-[11px] text-pitch-muted mt-1">
            Optional starting consideration. Final cash and deliverable terms are established in Stage 5 MoU.
          </p>
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
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError(null);
            }}
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
              onChange={(e) => {
                setContactEmail(e.target.value);
                if (error) setError(null);
              }}
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

