import React, { useState, useEffect } from 'react';
import companyService from '../../services/companyService';
import CompanyTable from '../../components/admin/CompanyTable';
import Dialog from '../../components/ui/Dialog';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import { formatDate } from '../../utils/formatDate';
import { Search, Building2, MapPin, Globe, ExternalLink, ShieldCheck } from 'lucide-react';

export function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchCompanies = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
        ...(search.trim() ? { search: search.trim() } : {}),
      };

      const res = await companyService.getCompanies(params);
      const list = res?.data || res?.companies || res || [];
      setCompanies(Array.isArray(list) ? list : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not load company directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCompanies(1);
  };

  const handleViewCompany = (company) => {
    setSelectedCompany(company);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          Company Sponsor Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect registered brand partners, their active profiles, and verified PITCH deal track records.
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
            placeholder="Search companies by name or industry..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-pitch-blue focus:ring-1 focus:ring-pitch-blue"
          />
        </form>

        <Button type="button" variant="outline" size="sm" onClick={() => fetchCompanies(1)}>
          Search
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoading message="Loading company directory..." />
      ) : error ? (
        <ErrorState title="Failed to load companies" message={error} onRetry={() => fetchCompanies(pagination.page)} />
      ) : (
        <CompanyTable
          companies={companies}
          onViewCompany={handleViewCompany}
          pagination={pagination}
          onPageChange={(page) => fetchCompanies(page)}
        />
      )}

      {/* View Company Detail Modal */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Company Sponsor Profile"
      >
        {selectedCompany && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-pitch-blue border border-blue-100 flex items-center justify-center font-bold shrink-0">
                {selectedCompany.logo ? (
                  <img src={selectedCompany.logo} alt={selectedCompany.companyName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">{selectedCompany.companyName}</h3>
                <p className="text-xs text-slate-500">{selectedCompany.industry || 'Corporate Sponsor'}</p>
              </div>
              <Badge variant="primary">
                {selectedCompany.completedDealsCount || 0} PITCH Deals
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Location</span>
                <span className="font-semibold text-slate-800">
                  {selectedCompany.location?.city ? `${selectedCompany.location.city}, ${selectedCompany.location.state || ''}` : selectedCompany.location || '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Registered Date</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedCompany.createdAt)}</span>
              </div>
            </div>

            {selectedCompany.website && (
              <div className="flex items-center gap-2 text-xs text-pitch-blue">
                <Globe className="w-4 h-4 shrink-0" />
                <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                  <span>{selectedCompany.website}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {selectedCompany.description && (
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Company Description</span>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedCompany.description}</p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-pitch-blue mb-0.5">
                <ShieldCheck className="w-4 h-4" />
                <span>PITCH Verified Track Record</span>
              </div>
              <p className="text-slate-600">
                Reputation on PITCH is strictly derived from completed deals and verified reviews. Self-reported external sponsorships remain distinct.
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

export default AdminCompanies;
