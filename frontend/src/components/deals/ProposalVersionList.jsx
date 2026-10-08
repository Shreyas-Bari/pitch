import React, { useState } from 'react';
import { History, ChevronRight, CheckCircle2, Clock, CornerDownRight, FileText } from 'lucide-react';
import ProposalCard from './ProposalCard';
import { formatDate } from '../../utils/formatDate';
import { PROPOSAL_STATUS } from '../../utils/constants';

export function ProposalVersionList({
  proposals = [],
  currentUserId,
  userRole,
  onAccept,
  onCounter,
  onDecline,
  onWithdraw,
  actionLoading = false,
}) {
  const [selectedVersionId, setSelectedVersionId] = useState(null);

  if (!proposals || proposals.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
        <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-700">No Proposals Yet</h4>
        <p className="text-xs text-slate-500 mt-1">
          Create the first structured sponsorship proposal to begin formal negotiation.
        </p>
      </div>
    );
  }

  // Sort descending by version for primary view or keep latest as default
  const sortedProposals = [...proposals].sort((a, b) => b.version - a.version);
  const latestProposal = sortedProposals[0];
  const activeProposal = selectedVersionId
    ? proposals.find((p) => p._id === selectedVersionId) || latestProposal
    : latestProposal;

  return (
    <div className="space-y-4">
      {/* Version selector pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
          <History className="w-3.5 h-3.5" /> Versions:
        </span>
        {proposals.map((p) => {
          const isSelected = activeProposal?._id === p._id;
          const isPending = p.status === PROPOSAL_STATUS.PENDING;
          const isAccepted = p.status === PROPOSAL_STATUS.ACCEPTED;

          return (
            <button
              key={p._id}
              type="button"
              onClick={() => setSelectedVersionId(p._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>V{p.version}</span>
              {isAccepted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              {isPending && <Clock className="w-3 h-3 text-amber-400" />}
              {p.version === latestProposal.version && (
                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-primary-100 text-primary-800">
                  Latest
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Proposal Detail View */}
      <ProposalCard
        proposal={activeProposal}
        currentUserId={currentUserId}
        userRole={userRole}
        isLatest={activeProposal?._id === latestProposal?._id}
        onAccept={onAccept}
        onCounter={onCounter}
        onDecline={onDecline}
        onWithdraw={onWithdraw}
        actionLoading={actionLoading}
      />
    </div>
  );
}

export default ProposalVersionList;
