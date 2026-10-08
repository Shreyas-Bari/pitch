import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import DealTable from '../../components/admin/DealTable';
import DealStatusBadge from '../../components/deals/DealStatusBadge';
import Dialog from '../../components/ui/Dialog';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { DEAL_STATUS } from '../../utils/constants';
import { Handshake, FileText, CheckCircle2, ShieldAlert, Star, Shield } from 'lucide-react';

export function AdminDeals() {
  const [deals, setDeals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Inspector Modal
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [dealInspectorData, setDealInspectorData] = useState(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);

  const fetchDeals = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
        ...(statusFilter ? { status: statusFilter } : {}),
      };

      const res = await adminService.getDeals(params);
      const list = res?.data || res?.deals || res || [];
      setDeals(Array.isArray(list) ? list : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch platform deals:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not load platform deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals(1);
  }, [statusFilter]);

  const handleInspectDeal = async (deal) => {
    try {
      setSelectedDealId(deal._id || deal.id);
      setInspectorModalOpen(true);
      setInspectorLoading(true);
      const res = await adminService.getDeal(deal._id || deal.id);
      setDealInspectorData(res?.data || res || { deal });
    } catch (err) {
      console.error('Failed to inspect deal details:', err);
      setDealInspectorData({ deal });
    } finally {
      setInspectorLoading(false);
    }
  };

  const inspectedDeal = dealInspectorData?.deal || null;
  const fulfillments = dealInspectorData?.fulfillments || [];
  const disputes = dealInspectorData?.disputes || [];
  const reviews = dealInspectorData?.reviews || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          Platform Deal Inspector
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect sponsorship negotiations, executed MoUs, fulfillment records, and dispute status across the network.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold text-slate-600">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-pitch-blue"
          >
            <option value="">All 16 Deal Statuses</option>
            <option value={DEAL_STATUS.INTERESTED}>INTERESTED</option>
            <option value={DEAL_STATUS.DISCUSSION}>DISCUSSION</option>
            <option value={DEAL_STATUS.NEGOTIATING}>NEGOTIATING</option>
            <option value={DEAL_STATUS.PROPOSAL}>PROPOSAL</option>
            <option value={DEAL_STATUS.COUNTER_PROPOSAL}>COUNTER_PROPOSAL</option>
            <option value={DEAL_STATUS.AGREED}>AGREED</option>
            <option value={DEAL_STATUS.MOU_DRAFT}>MOU_DRAFT</option>
            <option value={DEAL_STATUS.AWAITING_SIGNATURES}>AWAITING_SIGNATURES</option>
            <option value={DEAL_STATUS.PARTIALLY_SIGNED}>PARTIALLY_SIGNED</option>
            <option value={DEAL_STATUS.EXECUTED}>EXECUTED</option>
            <option value={DEAL_STATUS.FULFILLMENT}>FULFILLMENT</option>
            <option value={DEAL_STATUS.COMPLETED}>COMPLETED</option>
            <option value={DEAL_STATUS.DECLINED}>DECLINED</option>
            <option value={DEAL_STATUS.CANCELLED}>CANCELLED</option>
            <option value={DEAL_STATUS.DISPUTED}>DISPUTED</option>
            <option value={DEAL_STATUS.EXPIRED}>EXPIRED</option>
          </select>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => fetchDeals(1)}>
          Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoading message="Loading platform deals..." />
      ) : error ? (
        <ErrorState title="Failed to load deals" message={error} onRetry={() => fetchDeals(pagination.page)} />
      ) : (
        <DealTable
          deals={deals}
          onViewDeal={handleInspectDeal}
          pagination={pagination}
          onPageChange={(page) => fetchDeals(page)}
        />
      )}

      {/* Deal Inspector Modal */}
      <Dialog
        isOpen={inspectorModalOpen}
        onClose={() => setInspectorModalOpen(false)}
        title="Administrative Deal Inspector"
      >
        {inspectorLoading ? (
          <div className="py-12 text-center text-slate-400">Loading comprehensive deal dossier...</div>
        ) : inspectedDeal ? (
          <div className="space-y-4 text-sm text-slate-700 max-h-[70vh] overflow-y-auto pr-1">
            {/* Header / Parties */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">DEAL ID: {inspectedDeal._id || inspectedDeal.id}</span>
                <DealStatusBadge status={inspectedDeal.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Brand Sponsor</span>
                  <strong className="text-pitch-blue text-sm">
                    {inspectedDeal.companyId?.companyName || inspectedDeal.companyName || 'Brand'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Campus Committee</span>
                  <strong className="text-emerald-700 text-sm">
                    {inspectedDeal.committeeId?.committeeName || inspectedDeal.committeeName || 'Committee'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Event Context */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Event Context</span>
              <p className="font-semibold text-slate-900">{inspectedDeal.eventId?.title || inspectedDeal.eventTitle || 'Campus Event'}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Last modified: {formatDate(inspectedDeal.updatedAt || inspectedDeal.createdAt)}
              </p>
            </div>

            {/* Fulfillments Obligations */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fulfillment Obligations ({fulfillments.length})
                </span>
                <span className="text-xs text-slate-400">Platform Records</span>
              </div>
              {fulfillments.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">No fulfillment records initialized for this deal.</p>
              ) : (
                <div className="space-y-2 mt-1">
                  {fulfillments.map((f, i) => (
                    <div key={f._id || i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{f.title || f.contributionType || `Obligation #${i + 1}`}</span>
                        <div className="text-slate-500 text-[11px]">
                          Required: {f.requiredQuantity || '—'} • Fulfilled: {f.fulfilledQuantity || 0}
                        </div>
                      </div>
                      <Badge variant={f.status === 'FULFILLED' ? 'success' : f.status === 'PARTIALLY_FULFILLED' ? 'warning' : 'neutral'}>
                        {f.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disputes if any */}
            {disputes.length > 0 && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50">
                <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Associated Disputes ({disputes.length})</span>
                </div>
                {disputes.map((d, i) => (
                  <div key={d._id || i} className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs mb-1.5">
                    <p className="font-semibold text-slate-800">{d.reason}</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">{d.description}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status: {d.status}</span>
                      <span>Logged: {formatDate(d.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews if any */}
            {reviews.length > 0 && (
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase mb-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Submitted Reviews ({reviews.length})</span>
                </div>
                {reviews.map((r, i) => (
                  <div key={r._id || i} className="p-2 rounded-lg bg-slate-50 text-xs mb-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{r.reviewerUserId?.name || 'Reviewer'}</span>
                      <span className="font-bold text-amber-600">{r.rating} / 5 ★</span>
                    </div>
                    {r.comment && <p className="text-slate-600 mt-1 italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setInspectorModalOpen(false)}>
                Close Dossier
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

export default AdminDeals;
