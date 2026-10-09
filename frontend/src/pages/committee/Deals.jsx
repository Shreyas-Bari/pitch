import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  PlusCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import { dealService } from '../../services/dealService';
import DealCard from '../../components/deals/DealCard';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { DEAL_STATUS } from '../../utils/constants';

export function CommitteeDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dealService.getDeals();
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.deals || res?.deals || []);
      setDeals(list);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load deals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      // Tab filter
      if (activeTab === 'NEGOTIATION') {
        const negStatuses = [
          DEAL_STATUS.INTERESTED,
          DEAL_STATUS.DISCUSSION,
          DEAL_STATUS.NEGOTIATING,
          DEAL_STATUS.PROPOSAL,
          DEAL_STATUS.COUNTER_PROPOSAL,
        ];
        if (!negStatuses.includes(d.status)) return false;
      } else if (activeTab === 'MOU') {
        const mouStatuses = [
          DEAL_STATUS.AGREED,
          DEAL_STATUS.MOU_DRAFT,
          DEAL_STATUS.AWAITING_SIGNATURES,
          DEAL_STATUS.PARTIALLY_SIGNED,
        ];
        if (!mouStatuses.includes(d.status)) return false;
      } else if (activeTab === 'FULFILLMENT') {
        const fStatuses = [DEAL_STATUS.EXECUTED, DEAL_STATUS.FULFILLMENT];
        if (!fStatuses.includes(d.status)) return false;
      } else if (activeTab === 'COMPLETED') {
        if (d.status !== DEAL_STATUS.COMPLETED) return false;
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const partnerName = d.companyId?.name?.toLowerCase() || '';
      const eventTitle = d.eventId?.title?.toLowerCase() || '';
      return partnerName.includes(q) || eventTitle.includes(q);
    });
  }, [deals, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight">
            Brand Sponsorship Deals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage negotiations, review counter-proposals, digitally sign MoUs, and fulfill deliverables with brand sponsors.
          </p>
        </div>

        <Link to="/committee/events">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            My Events
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Deals' },
            { id: 'NEGOTIATION', label: 'Negotiations' },
            { id: 'MOU', label: 'MoU & Signing' },
            { id: 'FULFILLMENT', label: 'Fulfillment' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search event or sponsor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-500"
          />
        </div>
      </div>

      {/* Deals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton variant="text" width="60%" height={14} />
                  <Skeleton variant="text" width="40%" height={12} />
                </div>
              </div>
              <Skeleton variant="rounded" width="100%" height={56} />
              <Skeleton variant="text" width="80%" height={14} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          type="api"
          title="Unable to load sponsorship deals"
          message={error}
          onRetry={fetchDeals}
        />
      ) : filteredDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((deal) => (
            <DealCard
              key={deal._id}
              deal={deal}
              userRole="COMMITTEE"
              basePath="/committee/deals"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No sponsorship deals found"
          description={
            searchQuery || activeTab !== 'ALL'
              ? 'No deals match your current search or status filter.'
              : 'Direct commercial deals will appear once applications and invitations progress into negotiations.'
          }
          action={
            <Link to="/committee/companies">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Building2 className="w-4 h-4" />}
              >
                Explore Companies
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}

export default CommitteeDeals;
