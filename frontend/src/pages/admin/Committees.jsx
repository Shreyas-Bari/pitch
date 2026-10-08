import React, { useState, useEffect } from 'react';
import committeeService from '../../services/committeeService';
import CommitteeTable from '../../components/admin/CommitteeTable';
import Dialog from '../../components/ui/Dialog';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatDate';
import { Search, GraduationCap, MapPin, ShieldCheck, Calendar } from 'lucide-react';

export function AdminCommittees() {
  const [committees, setCommittees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchCommittees = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
        ...(search.trim() ? { search: search.trim() } : {}),
      };

      const res = await committeeService.getCommittees(params);
      const list = res?.data || res?.committees || res || [];
      setCommittees(Array.isArray(list) ? list : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch committees:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not load committee directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCommittees(1);
  };

  const handleViewCommittee = (committee) => {
    setSelectedCommittee(committee);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          Campus Committee Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect college organizing bodies, student councils, and verified PITCH deal track records.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search committees by name, department, or college..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-pitch-blue focus:ring-1 focus:ring-pitch-blue"
          />
        </form>

        <Button type="button" variant="outline" size="sm" onClick={() => fetchCommittees(1)}>
          Search
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoading message="Loading campus committee directory..." />
      ) : error ? (
        <ErrorState title="Failed to load committees" message={error} onRetry={() => fetchCommittees(pagination.page)} />
      ) : (
        <CommitteeTable
          committees={committees}
          onViewCommittee={handleViewCommittee}
          pagination={pagination}
          onPageChange={(page) => fetchCommittees(page)}
        />
      )}

      {/* View Committee Detail Modal */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Campus Committee Profile"
      >
        {selectedCommittee && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold shrink-0">
                {selectedCommittee.logo ? (
                  <img src={selectedCommittee.logo} alt={selectedCommittee.committeeName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <GraduationCap className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">{selectedCommittee.committeeName}</h3>
                <p className="text-xs text-slate-500">{selectedCommittee.collegeName || 'Academic Institution'}</p>
              </div>
              <Badge variant="success">
                {selectedCommittee.completedDealsCount || 0} PITCH Deals
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Institution / College</span>
                <span className="font-semibold text-slate-800">{selectedCommittee.collegeName || '—'}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Location</span>
                <span className="font-semibold text-slate-800">
                  {selectedCommittee.location?.city ? `${selectedCommittee.location.city}, ${selectedCommittee.location.state || ''}` : selectedCommittee.location || '—'}
                </span>
              </div>
            </div>

            {selectedCommittee.description && (
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">About Committee</span>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedCommittee.description}</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 mb-0.5">
                <ShieldCheck className="w-4 h-4" />
                <span>PITCH Verified Campus Record</span>
              </div>
              <p className="text-slate-600">
                Reputation is calculated solely based on completed PITCH deals and mutual feedback. Self-reported external events remain unverified.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default AdminCommittees;
