import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  CornerDownRight,
  User,
} from 'lucide-react';
import ContributionCard from './ContributionCard';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatDate';
import { PROPOSAL_STATUS } from '../../utils/constants';

export function ProposalCard({
  proposal,
  currentUserId,
  userRole,
  isLatest = false,
  onAccept,
  onCounter,
  onDecline,
  onWithdraw,
  actionLoading = false,
}) {
  if (!proposal) return null;

  const creatorId =
    typeof proposal.createdByUserId === 'object'
      ? proposal.createdByUserId?._id || proposal.createdByUserId?.id
      : proposal.createdByUserId;

  const creatorName =
    typeof proposal.createdByUserId === 'object'
      ? proposal.createdByUserId?.fullName || proposal.createdByUserId?.name
      : 'Participant';

  const creatorRole =
    typeof proposal.createdByUserId === 'object'
      ? proposal.createdByUserId?.role
      : null;

  const isAuthor = String(creatorId) === String(currentUserId);
  const isPending = proposal.status === PROPOSAL_STATUS.PENDING;
  const isAccepted = proposal.status === PROPOSAL_STATUS.ACCEPTED;
  const isSuperseded = proposal.status === PROPOSAL_STATUS.SUPERSEDED;

  const statusBadge = () => {
    switch (proposal.status) {
      case PROPOSAL_STATUS.ACCEPTED:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted & Agreed
          </span>
        );
      case PROPOSAL_STATUS.PENDING:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Response
          </span>
        );
      case PROPOSAL_STATUS.SUPERSEDED:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
            <CornerDownRight className="w-3.5 h-3.5" /> Superseded by Counter
          </span>
        );
      case PROPOSAL_STATUS.REJECTED:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Declined
          </span>
        );
      case PROPOSAL_STATUS.WITHDRAWN:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
            {proposal.status}
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isAccepted
          ? 'bg-white border-emerald-300 ring-2 ring-emerald-100 shadow-sm'
          : isLatest && isPending
          ? 'bg-white border-primary-200 ring-2 ring-primary-50 shadow-sm'
          : 'bg-white/80 border-slate-200 shadow-2xs'
      } p-4 sm:p-5`}
    >
      {/* Proposal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider bg-slate-900 text-white font-mono">
              Version {proposal.version}
            </span>
            {proposal.basedOnProposalId && (
              <span className="text-[11px] font-medium text-slate-500">
                (Counter to V{proposal.version - 1})
              </span>
            )}
            {isLatest && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Current Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Authored by <strong className="text-slate-800">{creatorName}</strong> ({creatorRole || 'Partner'}) on {formatDate(proposal.createdAt, { includeTime: true })}
            </span>
          </p>
        </div>

        <div className="shrink-0">{statusBadge()}</div>
      </div>

      {/* Accepted summary notice */}
      {isAccepted && (
        <div className="my-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Agreed Commercial Baseline</p>
            <p className="text-emerald-700 mt-0.5">
              These terms were accepted by the counterparty and form the immutable snapshot for the Digital MoU agreement.
            </p>
          </div>
        </div>
      )}

      {/* Contributions Section */}
      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display mb-2.5">
          Agreed / Proposed Contributions
        </h4>
        <ContributionCard contribution={proposal.contribution} />
      </div>

      {/* Deliverables Section */}
      {proposal.deliverables && proposal.deliverables.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display mb-2">
            Obligations & Deliverables ({proposal.deliverables.length})
          </h4>
          <div className="space-y-1.5 text-xs">
            {proposal.deliverables.map((del, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                      del.party === 'COMPANY'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {del.party}
                  </span>
                  <p className="text-slate-700 leading-relaxed">{del.description}</p>
                </div>
                {del.dueDate && (
                  <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                    Due: {formatDate(del.dueDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      {proposal.benefits && proposal.benefits.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display mb-2">
            Key Sponsor Benefits
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {proposal.benefits.map((b, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">{b.title}</p>
                  {b.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{b.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      {proposal.terms && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display mb-1">
            Commercial Notes & Terms
          </h4>
          <p className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            {proposal.terms}
          </p>
        </div>
      )}

      {/* Contextual Action Bar for Pending Proposals */}
      {isPending && isLatest && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
          {!isAuthor ? (
            <>
              {onDecline && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDecline(proposal)}
                  disabled={actionLoading}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
                >
                  Decline
                </Button>
              )}
              {onCounter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCounter(proposal)}
                  disabled={actionLoading}
                  className="text-xs"
                >
                  Submit Counter-Proposal
                </Button>
              )}
              {onAccept && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAccept(proposal)}
                  isLoading={actionLoading}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Accept Terms & Proceed to MoU
                </Button>
              )}
            </>
          ) : (
            <>
              <span className="text-xs text-slate-400 mr-auto flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Awaiting counterparty review
              </span>
              {onWithdraw && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onWithdraw(proposal)}
                  disabled={actionLoading}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Withdraw Proposal
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ProposalCard;
