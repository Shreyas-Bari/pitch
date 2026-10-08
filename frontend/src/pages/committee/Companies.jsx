import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Sparkles, Mail, Send, Check } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { eventService } from '../../services/eventService';
import { invitationService } from '../../services/invitationService';
import useDebounce from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import CompanyCard from '../../components/companies/CompanyCard';
import CompanyFilters from '../../components/companies/CompanyFilters';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';
import Dialog, { DialogFooter } from '../../components/ui/Dialog';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';

export function CommitteeCompanies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    industry: searchParams.get('industry') || '',
    city: searchParams.get('city') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12,
  }));

  const debouncedSearch = useDebounce(filters.search, 400);

  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite modal state
  const [inviteModalCompany, setInviteModalCompany] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Synchronize URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.industry) params.set('industry', filters.industry);
    if (filters.city) params.set('city', filters.city);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Load committee's events for invitation dialog
  useEffect(() => {
    eventService
      .getMyEvents()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : res?.events || [];
        setMyEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0]._id || list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        industry: filters.industry || undefined,
        city: filters.city || undefined,
        page: filters.page,
        limit: filters.limit,
      };

      if (debouncedSearch && debouncedSearch.trim()) {
        queryParams.search = debouncedSearch.trim();
      }

      const res = await companyService.getCompanies(queryParams);
      const companyList = Array.isArray(res?.data) ? res.data : [];
      setCompanies(companyList);

      if (res?.pagination) {
        setPagination(res.pagination);
      } else {
        setPagination({
          page: filters.page,
          limit: filters.limit,
          total: companyList.length,
          totalPages: Math.max(1, Math.ceil(companyList.length / filters.limit)),
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.industry, filters.city, filters.page, filters.limit]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      industry: '',
      city: '',
      page: 1,
      limit: 12,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenInvite = (company) => {
    if (myEvents.length === 0) {
      toast.warning('You must create and publish a campus event before inviting brands.');
      return;
    }
    setInviteModalCompany(company);
    setInviteMessage('');
  };

  const handleSendInviteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !inviteModalCompany) return;

    const companyId = inviteModalCompany._id || inviteModalCompany.id;

    try {
      setSendingInvite(true);
      await invitationService.sendInvitation(selectedEventId, {
        companyId,
        message: inviteMessage.trim() || undefined,
      });

      toast.success(`Invitation sent to ${inviteModalCompany.name}!`);
      setInviteModalCompany(null);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const hasActiveFilters = Boolean(filters.search || filters.industry || filters.city);

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
          <Building2 className="w-6 h-6 text-pitch-blue" />
          <span>Explore Corporate Sponsors</span>
        </h1>
        <p className="text-sm text-pitch-muted mt-1">
          Discover brand sponsors actively interested in collegiate events and send them direct fest invitations.
        </p>
      </div>

      {/* Discovery Filters */}
      <CompanyFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={pagination.total}
      />

      {/* States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Companies"
          message={error}
          onRetry={fetchCompanies}
        />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasActiveFilters ? 'No Matching Brands Found' : 'No Companies Listed'}
          description={
            hasActiveFilters
              ? 'Try adjusting your search terms or clearing industry filters.'
              : 'Corporate sponsor profiles are currently onboarding.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            ) : null
          }
          className="my-8 py-16"
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => {
              const id = company._id || company.id;
              return (
                <div key={id} className="flex flex-col">
                  <CompanyCard company={company} />
                  <div className="mt-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold text-pitch-blue border-blue-200 hover:bg-blue-50"
                      leftIcon={<Mail className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenInvite(company)}
                    >
                      Invite to Sponsor Event
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Page <span className="font-semibold text-pitch-navy">{pagination.page}</span> of{' '}
                <span className="font-semibold text-pitch-navy">{pagination.totalPages}</span>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalCompany && (
        <Dialog
          isOpen={Boolean(inviteModalCompany)}
          onClose={() => setInviteModalCompany(null)}
          title={`Invite ${inviteModalCompany.name} to Sponsor`}
          description="Send a formal invitation to this brand to sponsor your campus festival."
        >
          <form onSubmit={handleSendInviteSubmit} className="space-y-4">
            <Select
              label="Select Your Campus Event"
              options={myEvents.map((e) => ({
                value: e._id || e.id,
                label: `${e.title} (${e.status})`,
              }))}
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              required
            />

            <Textarea
              label="Personalized Message (Optional)"
              rows={4}
              placeholder={`Hi ${inviteModalCompany.name} team,\n\nWe would love to invite your brand to sponsor our upcoming campus festival. Our event expects significant campus footfall and audience reach that aligns with your brand objectives.`}
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInviteModalCompany(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={sendingInvite}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Fest Invitation
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      )}
    </div>
  );
}

export default CommitteeCompanies;
