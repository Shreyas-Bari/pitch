import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  FileSignature,
  PackageCheck,
  Award,
  AlertTriangle,
  Ban,
  ArrowLeft,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Plus,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { dealService } from '../../services/dealService';
import { proposalService } from '../../services/proposalService';
import { mouService } from '../../services/mouService';
import { fulfillmentService } from '../../services/fulfillmentService';
import { reviewService } from '../../services/reviewService';

import DealStatusBadge from './DealStatusBadge';
import DealTimeline from './DealTimeline';
import ProposalVersionList from './ProposalVersionList';
import ProposalFormModal from './ProposalFormModal';
import FulfillmentTracker from './FulfillmentTracker';
import DisputeModal from './DisputeModal';
import SignatureStatus from '../mou/SignatureStatus';
import ReviewCard from '../reviews/ReviewCard';
import ReviewFormModal from '../reviews/ReviewFormModal';

import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import PageLoading from '../ui/PageLoading';
import ErrorState from '../ui/ErrorState';
import { DEAL_STATUS, PROPOSAL_STATUS } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';

export function DealWorkspace({ basePath = '/deals' }) {
  const { id: dealId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const currentUserId = user?._id || user?.id;
  const userRole = user?.role;

  // Main Deal State
  const [deal, setDeal] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [mouData, setMouData] = useState(null);
  const [fulfillments, setFulfillments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active workspace tab
  const [activeTab, setActiveTab] = useState('PROPOSALS'); // PROPOSALS | MOU | FULFILLMENT | REVIEWS

  // Modal controls
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [isCounterProposal, setIsCounterProposal] = useState(false);
  const [baseProposalForCounter, setBaseProposalForCounter] = useState(null);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [generatingMou, setGeneratingMou] = useState(false);
  const [completingDeal, setCompletingDeal] = useState(false);

  // 1. Fetch deal & associated datasets
  const fetchDealData = useCallback(async () => {
    if (!dealId) return;
    try {
      setLoading(true);
      setError(null);

      // Primary deal record
      const dealRes = await dealService.getDeal(dealId);
      const d = dealRes?.data?.deal || dealRes?.deal || dealRes;
      setDeal(d);

      // Fetch proposals
      try {
        const propRes = await proposalService.getProposals(dealId);
        setProposals(propRes?.data?.proposals || propRes?.proposals || propRes || []);
      } catch {
        setProposals([]);
      }

      // Fetch MoU if exists or deal reached AGREED+
      if (d.mouId || [DEAL_STATUS.AGREED, DEAL_STATUS.MOU_DRAFT, DEAL_STATUS.AWAITING_SIGNATURES, DEAL_STATUS.PARTIALLY_SIGNED, DEAL_STATUS.EXECUTED, DEAL_STATUS.FULFILLMENT, DEAL_STATUS.COMPLETED].includes(d.status)) {
        try {
          const mouRes = await mouService.getMouByDeal(dealId);
          setMouData(mouRes?.data?.mou || mouRes?.mou || mouRes);
        } catch {
          setMouData(null);
        }
      }

      // Fetch fulfillments if EXECUTED or later
      if ([DEAL_STATUS.EXECUTED, DEAL_STATUS.FULFILLMENT, DEAL_STATUS.COMPLETED, DEAL_STATUS.DISPUTED].includes(d.status)) {
        try {
          const fRes = await fulfillmentService.getFulfillmentsByDeal(dealId);
          setFulfillments(fRes?.data?.fulfillments || fRes?.fulfillments || fRes || []);
        } catch {
          setFulfillments([]);
        }
      }

      // Fetch reviews if COMPLETED
      if (d.status === DEAL_STATUS.COMPLETED) {
        try {
          const rRes = await reviewService.getDealReviews(dealId);
          setReviews(rRes?.data?.reviews || rRes?.reviews || rRes || []);
        } catch {
          setReviews([]);
        }
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError('UNAUTHORIZED');
      } else if (status === 404) {
        setError('NOT_FOUND');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load deal.');
      }
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDealData();
  }, [fetchDealData]);

  // Adjust default tab based on deal status
  useEffect(() => {
    if (deal) {
      if (deal.status === DEAL_STATUS.COMPLETED) {
        setActiveTab('REVIEWS');
      } else if ([DEAL_STATUS.EXECUTED, DEAL_STATUS.FULFILLMENT].includes(deal.status)) {
        setActiveTab('FULFILLMENT');
      } else if ([DEAL_STATUS.AGREED, DEAL_STATUS.MOU_DRAFT, DEAL_STATUS.AWAITING_SIGNATURES, DEAL_STATUS.PARTIALLY_SIGNED].includes(deal.status)) {
        setActiveTab('MOU');
      } else {
        setActiveTab('PROPOSALS');
      }
    }
  }, [deal?.status]);

  // Proposal Actions
  const handleOpenCreateProposal = () => {
    setIsCounterProposal(false);
    setBaseProposalForCounter(null);
    setProposalModalOpen(true);
  };

  const handleOpenCounterProposal = (proposal) => {
    setIsCounterProposal(true);
    setBaseProposalForCounter(proposal);
    setProposalModalOpen(true);
  };

  const handleSubmitProposalForm = async (payload) => {
    try {
      setSubmittingProposal(true);
      if (isCounterProposal && baseProposalForCounter) {
        await proposalService.counterProposal(baseProposalForCounter._id, payload);
        toast.success(`Counter-proposal V${baseProposalForCounter.version + 1} submitted.`);
      } else {
        await proposalService.createProposal(dealId, payload);
        toast.success('Proposal submitted successfully.');
      }
      setProposalModalOpen(false);
      fetchDealData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit proposal.');
    } finally {
      setSubmittingProposal(false);
    }
  };

  const handleAcceptProposal = async (proposal) => {
    try {
      await proposalService.acceptProposal(proposal._id);
      toast.success('Proposal accepted! Commercial baseline locked. Deal moved to AGREED.');
      fetchDealData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to accept proposal.');
    }
  };

  const handleDeclineProposal = async (proposal) => {
    try {
      await proposalService.declineProposal(proposal._id, 'Declined by counterparty');
      toast.info('Proposal declined.');
      fetchDealData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to decline proposal.');
    }
  };

  const handleWithdrawProposal = async (proposal) => {
    try {
      await proposalService.withdrawProposal(proposal._id);
      toast.info('Proposal withdrawn.');
      fetchDealData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to withdraw proposal.');
    }
  };

  // Lifecycle Transitions
  const handleStartNegotiation = async () => {
    try {
      await dealService.updateDeal(dealId, { status: DEAL_STATUS.NEGOTIATING });
      toast.success('Deal moved to active NEGOTIATING stage.');
      fetchDealData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to transition to negotiation.');
    }
  };

  const handleGenerateMou = async () => {
    try {
      setGeneratingMou(true);
      const res = await mouService.generateMou(dealId, {
        legalSettings: { jurisdiction: 'Mumbai, India', curePeriodDays: 15, noticePeriodDays: 30 },
      });
      toast.success('Digital MoU agreement draft generated successfully.');
      const mId = res?.data?.mou?._id || res?.mou?._id || res?.data?._id;
      if (mId) {
        navigate(`/mou/${mId}`);
      } else {
        fetchDealData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to generate MoU.');
    } finally {
      setGeneratingMou(false);
    }
  };

  const handleCompleteDeal = async () => {
    try {
      setCompletingDeal(true);
      await dealService.completeDeal(dealId);
      toast.success('Deal marked as COMPLETED! Verified reviews are now open.');
      fetchDealData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to complete deal.');
    } finally {
      setCompletingDeal(false);
    }
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await dealService.cancelDeal(dealId, cancelReason || 'Cancelled by participant');
      toast.info('Deal has been cancelled.');
      setCancelModalOpen(false);
      fetchDealData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel deal.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageLoading message="Loading sponsorship deal workspace..." />;

  if (error) {
    if (error === 'UNAUTHORIZED') {
      return (
        <ErrorState
          type="forbidden"
          title="Access Restricted"
          message="You are not an authorized participant in this sponsorship deal."
          backUrl={basePath}
        />
      );
    }
    if (error === 'NOT_FOUND') {
      return (
        <ErrorState
          type="notfound"
          title="Deal Not Found"
          message="The requested sponsorship deal could not be located."
          backUrl={basePath}
        />
      );
    }
    return (
      <ErrorState
        type="api"
        title="Unable to load deal"
        message={error}
        onRetry={fetchDealData}
        backUrl={basePath}
      />
    );
  }

  if (!deal) return null;

  const isCompany = userRole === 'COMPANY';
  const partner = isCompany ? deal.committeeId : deal.companyId;
  const partnerName = partner?.name || (isCompany ? 'Campus Committee' : 'Brand Sponsor');
  const partnerSub = isCompany
    ? partner?.college || 'College Committee'
    : partner?.industry || 'Brand Partner';
  const partnerAvatar = partner?.logo || partner?.logoUrl || null;
  const partnerRole = isCompany ? 'COMMITTEE' : 'COMPANY';
  const partnerProfileLink = isCompany
    ? partner?._id ? `/committees/${partner._id}` : null
    : partner?._id ? `/companies/${partner._id}` : null;

  const event = deal.eventId || {};

  const isClosed = [DEAL_STATUS.COMPLETED, DEAL_STATUS.CANCELLED, DEAL_STATUS.DECLINED, DEAL_STATUS.EXPIRED].includes(deal.status);
  const mouId = deal.mouId?._id || deal.mouId || mouData?._id;

  const hasReviewed = reviews.some((r) => {
    const rId = typeof r.reviewerUserId === 'object' ? r.reviewerUserId?._id : r.reviewerUserId;
    return String(rId) === String(currentUserId);
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation & Back */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to={basePath}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deals Pipeline</span>
        </Link>

        {deal.conversationId && (
          <Link
            to={
              isCompany
                ? `/company/conversations/${deal.conversationId?._id || deal.conversationId}`
                : `/committee/conversations/${deal.conversationId?._id || deal.conversationId}`
            }
          >
            <Button variant="ghost" size="sm" className="text-xs">
              Open Chat Workspace
            </Button>
          </Link>
        )}
      </div>

      {/* Main Deal Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Partner & Event Info */}
          <div className="flex items-start gap-4">
            <Avatar name={partnerName} src={partnerAvatar} size="lg" role={partnerRole} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DealStatusBadge status={deal.status} size="sm" />
                <span className="text-xs text-slate-400 font-mono">
                  ID: {deal._id?.slice(-8)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-display text-slate-950">
                  {partnerName}
                </h1>
                {partnerProfileLink && (
                  <Link
                    to={partnerProfileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-0.5">{partnerSub}</p>

              {event.title && (
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-2 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-primary-600" />
                  <span>
                    Event: <strong className="text-slate-900">{event.title}</strong>
                    {event.eventDate && ` (${formatDate(event.eventDate)})`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contextual Primary Actions */}
          <div className="flex flex-wrap items-center gap-2 md:self-start">
            {/* 1. Start Negotiation */}
            {[DEAL_STATUS.INTERESTED, DEAL_STATUS.DISCUSSION].includes(deal.status) && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartNegotiation}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="text-xs"
              >
                Start Formal Negotiation
              </Button>
            )}

            {/* 2. Create Proposal */}
            {[DEAL_STATUS.NEGOTIATING, DEAL_STATUS.DISCUSSION].includes(deal.status) && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateProposal}
                leftIcon={<Plus className="w-4 h-4" />}
                className="text-xs"
              >
                Create Proposal
              </Button>
            )}

            {/* 3. Generate MoU Draft when AGREED */}
            {deal.status === DEAL_STATUS.AGREED && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateMou}
                isLoading={generatingMou}
                leftIcon={<FileSignature className="w-4 h-4" />}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Draft Formal MoU
              </Button>
            )}

            {/* 4. Review & Sign MoU */}
            {[DEAL_STATUS.MOU_DRAFT, DEAL_STATUS.AWAITING_SIGNATURES, DEAL_STATUS.PARTIALLY_SIGNED].includes(deal.status) && (
              <Link to={`/mou/${mouId || ''}`}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<FileSignature className="w-4 h-4" />}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Review & Sign MoU
                </Button>
              </Link>
            )}

            {/* 5. Complete Deal */}
            {deal.status === DEAL_STATUS.FULFILLMENT && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCompleteDeal}
                isLoading={completingDeal}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                className="text-xs bg-green-600 hover:bg-green-700 text-white"
              >
                Complete Deal
              </Button>
            )}

            {/* 6. Review after Completion */}
            {deal.status === DEAL_STATUS.COMPLETED && !hasReviewed && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setReviewModalOpen(true)}
                leftIcon={<Award className="w-4 h-4" />}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                Write Partner Review
              </Button>
            )}

            {/* Secondary actions: Dispute / Cancel */}
            {!isClosed && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDisputeModalOpen(true)}
                  leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                  className="text-xs"
                >
                  Dispute
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                  leftIcon={<Ban className="w-3.5 h-3.5 text-slate-400" />}
                  className="text-xs text-slate-500 hover:text-red-600"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stepper Progression */}
        <DealTimeline
          status={deal.status}
          cancellationReason={deal.cancellationReason}
        />
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveTab('PROPOSALS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'PROPOSALS'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Proposals & Terms ({proposals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MOU')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'MOU'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSignature className="w-3.5 h-3.5" />
          <span>MoU & Signatures</span>
          {mouData && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FULFILLMENT')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'FULFILLMENT'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Fulfillment ({fulfillments.length})</span>
        </button>

        {deal.status === DEAL_STATUS.COMPLETED && (
          <button
            type="button"
            onClick={() => setActiveTab('REVIEWS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'REVIEWS'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Verified Reviews ({reviews.length})</span>
          </button>
        )}
      </div>

      {/* Tab 1: Proposals View */}
      {activeTab === 'PROPOSALS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Proposal Negotiation History
            </h3>

            {!isClosed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateProposal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Submit New Version
              </Button>
            )}
          </div>

          <ProposalVersionList
            proposals={proposals}
            currentUserId={currentUserId}
            userRole={userRole}
            onAccept={handleAcceptProposal}
            onCounter={handleOpenCounterProposal}
            onDecline={handleDeclineProposal}
            onWithdraw={handleWithdrawProposal}
          />
        </div>
      )}

      {/* Tab 2: MoU & Signatures View */}
      {activeTab === 'MOU' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Digital MoU & Signing Execution
            </h3>

            {mouId ? (
              <Link to={`/mou/${mouId}`}>
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Open Full MoU Review Screen
                </Button>
              </Link>
            ) : deal.status === DEAL_STATUS.AGREED ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateMou}
                isLoading={generatingMou}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Generate Draft MoU
              </Button>
            ) : null}
          </div>

          {mouData ? (
            <div className="space-y-4">
              <SignatureStatus
                signatories={mouData.currentVersionId?.agreementSnapshot?.signatories || []}
                mouStatus={mouData.status}
                versionNumber={mouData.currentVersionId?.versionNumber || 1}
              />

              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-sm">Agreement Snapshot</span>
                  <span className="font-mono text-slate-500">
                    Template: {mouData.currentVersionId?.templateIdentifier || 'PITCH_MOU_V1'}
                  </span>
                </div>

                {mouData.currentVersionId?.documentHash && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Lock className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                    <span>SHA-256 Hash:</span>
                    <code className="text-[11px] font-mono text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {mouData.currentVersionId.documentHash}
                    </code>
                  </div>
                )}

                <p className="text-slate-600 leading-relaxed">
                  Both brand sponsor and campus committee convenor must review and affix digital signatures before this partnership enters legal execution.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
              <FileSignature className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">MoU Not Yet Drafted</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Once a final proposal is accepted, the deal moves to AGREED status and the formal closing MoU draft can be generated.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fulfillment View */}
      {activeTab === 'FULFILLMENT' && (
        <FulfillmentTracker
          dealId={deal._id}
          fulfillments={fulfillments}
          userRole={userRole}
          onRefresh={fetchDealData}
        />
      )}

      {/* Tab 4: Reviews View */}
      {activeTab === 'REVIEWS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              PITCH Verified Reviews
            </h3>

            {!hasReviewed && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setReviewModalOpen(true)}
                leftIcon={<Award className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Write Partner Review
              </Button>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <ReviewCard key={rev._id} review={rev} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
              <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Reviews Yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Completed deals allow one reciprocal verified review per participant.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Proposal Modal */}
      <ProposalFormModal
        isOpen={proposalModalOpen}
        onClose={() => setProposalModalOpen(false)}
        onSubmit={handleSubmitProposalForm}
        isCounter={isCounterProposal}
        baseProposal={baseProposalForCounter}
        isSubmitting={submittingProposal}
      />

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        dealId={deal._id}
        onDisputeRaised={fetchDealData}
      />

      {/* Review Modal */}
      <ReviewFormModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        dealId={deal._id}
        onReviewSubmitted={fetchDealData}
      />

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Sponsorship Deal"
        description="Are you sure you want to cancel this sponsorship negotiation? This terminates active proposal reviews and marks the deal as CANCELLED."
        confirmText="Cancel Deal"
        variant="danger"
        isLoading={cancelling}
      />
    </div>
  );
}

export default DealWorkspace;
