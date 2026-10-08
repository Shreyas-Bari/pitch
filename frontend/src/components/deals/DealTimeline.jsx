import React from 'react';
import {
  Check,
  CircleDot,
  AlertTriangle,
  Ban,
  XCircle,
  Clock,
} from 'lucide-react';
import { DEAL_STATUS } from '../../utils/constants';

const LIFECYCLE_STEPS = [
  { id: 'DISCUSSION', label: 'Discussion', statuses: [DEAL_STATUS.INTERESTED, DEAL_STATUS.DISCUSSION] },
  { id: 'NEGOTIATING', label: 'Negotiation', statuses: [DEAL_STATUS.NEGOTIATING] },
  { id: 'PROPOSAL', label: 'Proposal', statuses: [DEAL_STATUS.PROPOSAL, DEAL_STATUS.COUNTER_PROPOSAL] },
  { id: 'AGREED', label: 'Agreed', statuses: [DEAL_STATUS.AGREED] },
  { id: 'MOU_DRAFT', label: 'MoU Draft', statuses: [DEAL_STATUS.MOU_DRAFT] },
  { id: 'SIGNING', label: 'Signing', statuses: [DEAL_STATUS.AWAITING_SIGNATURES, DEAL_STATUS.PARTIALLY_SIGNED] },
  { id: 'EXECUTED', label: 'Executed', statuses: [DEAL_STATUS.EXECUTED] },
  { id: 'FULFILLMENT', label: 'Fulfillment', statuses: [DEAL_STATUS.FULFILLMENT] },
  { id: 'COMPLETED', label: 'Completed', statuses: [DEAL_STATUS.COMPLETED] },
];

export function DealTimeline({ status, cancellationReason }) {
  const isTerminalOrException = [
    DEAL_STATUS.CANCELLED,
    DEAL_STATUS.DECLINED,
    DEAL_STATUS.DISPUTED,
    DEAL_STATUS.EXPIRED,
  ].includes(status);

  // Find index of current status in progression
  const currentStepIndex = LIFECYCLE_STEPS.findIndex((step) =>
    step.statuses.includes(status)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
          Deal Progression
        </h3>
        {isTerminalOrException && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border">
            {status === DEAL_STATUS.DISPUTED && (
              <span className="text-red-700 bg-red-50 border-red-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Under Dispute
              </span>
            )}
            {status === DEAL_STATUS.CANCELLED && (
              <span className="text-slate-700 bg-slate-100 border-slate-200 flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" /> Cancelled
              </span>
            )}
            {status === DEAL_STATUS.DECLINED && (
              <span className="text-rose-700 bg-rose-50 border-rose-200 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Declined
              </span>
            )}
            {status === DEAL_STATUS.EXPIRED && (
              <span className="text-stone-700 bg-stone-100 border-stone-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Expired
              </span>
            )}
          </div>
        )}
      </div>

      {cancellationReason && status === DEAL_STATUS.CANCELLED && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">Reason for cancellation:</span>{' '}
          {cancellationReason}
        </div>
      )}

      {/* Stepper track */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[680px] relative">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx || status === DEAL_STATUS.COMPLETED;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={step.id}
                className="flex-1 flex flex-col items-center relative group"
              >
                {/* Connecting Line */}
                {idx > 0 && (
                  <div
                    className={`absolute top-3.5 -left-1/2 w-full h-0.5 -z-0 transition-colors ${
                      isCompleted || isCurrent ? 'bg-primary-600' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Node */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all select-none ${
                    isCompleted
                      ? 'bg-primary-600 text-white ring-4 ring-primary-50'
                      : isCurrent
                      ? 'bg-white text-primary-600 ring-4 ring-primary-100 border-2 border-primary-600 animate-pulse'
                      : 'bg-white text-slate-400 border border-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <CircleDot className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-[11px] mt-2 font-medium tracking-tight text-center truncate max-w-[85px] ${
                    isCurrent
                      ? 'text-primary-700 font-bold'
                      : isCompleted
                      ? 'text-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DealTimeline;
