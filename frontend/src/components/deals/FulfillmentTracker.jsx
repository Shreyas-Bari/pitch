import React, { useState } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  FileText,
  Upload,
  Info,
  DollarSign,
  Paperclip,
} from 'lucide-react';
import Button from '../ui/Button';
import Dialog, { DialogFooter } from '../ui/Dialog';
import Input from '../ui/Input';
import { FULFILLMENT_STATUS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { fulfillmentService } from '../../services/fulfillmentService';
import { useToast } from '../../hooks/useToast';

export function FulfillmentTracker({
  dealId,
  fulfillments = [],
  userRole,
  onRefresh,
}) {
  const toast = useToast();
  const [activeFulfillment, setActiveFulfillment] = useState(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  // Form states
  const [completionNotes, setCompletionNotes] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Handlers
  const handleOpenCompleteModal = (f) => {
    setActiveFulfillment(f);
    setCompletionNotes('');
    setCompleteModalOpen(true);
  };

  const handleOpenEvidenceModal = async (f) => {
    setActiveFulfillment(f);
    setEvidenceDescription('');
    setEvidenceModalOpen(true);
    try {
      setEvidenceLoading(true);
      const res = await fulfillmentService.getEvidence(f._id);
      setEvidenceList(res?.data || res || []);
    } catch {
      setEvidenceList([]);
    } finally {
      setEvidenceLoading(false);
    }
  };

  const handleConfirmComplete = async () => {
    if (!activeFulfillment) return;
    try {
      setSubmitting(true);
      await fulfillmentService.completeFulfillment(activeFulfillment._id, completionNotes);
      toast.success('Obligation marked as fulfilled.');
      setCompleteModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to complete obligation.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case FULFILLMENT_STATUS.FULFILLED:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Fulfilled
          </span>
        );
      case FULFILLMENT_STATUS.PARTIALLY_FULFILLED:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Partially Fulfilled
          </span>
        );
      case FULFILLMENT_STATUS.DISPUTED:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Disputed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const totalCount = fulfillments.length;
  const fulfilledCount = fulfillments.filter((f) => f.status === FULFILLMENT_STATUS.FULFILLED).length;
  const progressPct = totalCount > 0 ? Math.round((fulfilledCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Progress */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-primary-600" />
              <span>Sponsorship Fulfillment & Deliverables</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track deliverables, upload proof of fulfillment, and record milestone completions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">
              {fulfilledCount} / {totalCount} Completed ({progressPct}%)
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* External Cash Notice */}
      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>External Payment Notice:</strong> PITCH does not process monetary payments or escrow. Direct wire, UPI, or cheque transactions occur externally between company and committee, and receipt confirmation is recorded here.
        </p>
      </div>

      {/* Obligations List */}
      <div className="divide-y divide-slate-100">
        {fulfillments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No fulfillment obligations registered for this deal yet.
          </div>
        ) : (
          fulfillments.map((item) => {
            const isCompleted = item.status === FULFILLMENT_STATUS.FULFILLED;

            return (
              <div
                key={item._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.responsibleParty === 'COMPANY'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.responsibleParty}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {item.type}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      Qty: <strong>{item.quantity} {item.unit || 'units'}</strong>
                    </span>
                    {item.dueDate && (
                      <span>Due: {formatDate(item.dueDate)}</span>
                    )}
                    {item.completedAt && (
                      <span className="text-emerald-700 font-medium">
                        Completed {formatDate(item.completedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEvidenceModal(item)}
                    leftIcon={<Paperclip className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Evidence
                  </Button>

                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCompleteModal(item)}
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      className="text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Complete Obligation Modal */}
      <Dialog
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Confirm Obligation Completion"
        description={`Record fulfillment for: "${activeFulfillment?.description}"`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Completion Notes / Reference
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Banners hung at main stage entrance on day 1. Handover acknowledged."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:border-primary-500 leading-relaxed"
            />
          </div>

          <DialogFooter className="-mx-6 -mb-6 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCompleteModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmComplete}
              isLoading={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Fulfilled
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Evidence Modal */}
      <Dialog
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Fulfillment Evidence & Proofs"
        description={`Evidence records for: "${activeFulfillment?.description}"`}
        size="md"
      >
        <div className="space-y-4">
          {evidenceLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading evidence...</div>
          ) : evidenceList.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              No photo/document proofs uploaded for this deliverable yet.
            </div>
          ) : (
            <div className="space-y-2">
              {evidenceList.map((ev, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <p className="font-semibold text-slate-900">{ev.description || 'Fulfillment Proof'}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Uploaded {formatDate(ev.createdAt)}</p>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="-mx-6 -mb-6 mt-4">
            <Button type="button" variant="ghost" onClick={() => setEvidenceModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}

export default FulfillmentTracker;
