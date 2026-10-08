import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GraduationCap, Sparkles, School } from 'lucide-react';
import { committeeService } from '../../services/committeeService';
import useDebounce from '../../hooks/useDebounce';
import CommitteeCard from '../../components/committees/CommitteeCard';
import CommitteeFilters from '../../components/committees/CommitteeFilters';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';

export function Committees() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state initialized from URL query params or defaults
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    committeeType: searchParams.get('committeeType') || '',
    city: searchParams.get('city') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12,
  }));

  const debouncedSearch = useDebounce(filters.search, 400);

  const [committees, setCommittees] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Synchronize URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.committeeType) params.set('committeeType', filters.committeeType);
    if (filters.city) params.set('city', filters.city);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch committees from backend API
  const fetchCommittees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        committeeType: filters.committeeType || undefined,
        city: filters.city || undefined,
        page: filters.page,
        limit: filters.limit,
      };

      if (debouncedSearch && debouncedSearch.trim()) {
        queryParams.search = debouncedSearch.trim();
      }

      const res = await committeeService.getCommittees(queryParams);

      // Handle backend standard format { success: true, data: [...], pagination: { ... } }
      const committeeList = Array.isArray(res?.data) ? res.data : [];
      setCommittees(committeeList);

      if (res?.pagination) {
        setPagination(res.pagination);
      } else {
        setPagination({
          page: filters.page,
          limit: filters.limit,
          total: committeeList.length,
          totalPages: Math.max(1, Math.ceil(committeeList.length / filters.limit)),
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load committees');
      setCommittees([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.committeeType, filters.city, filters.page, filters.limit]);

  useEffect(() => {
    fetchCommittees();
  }, [fetchCommittees]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      committeeType: '',
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

  const hasActiveFilters = Boolean(filters.search || filters.committeeType || filters.city);

  return (
    <div className="min-w-0 pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-primary-50/60 to-surface-0 border-b border-surface-200 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/70 text-primary-700 text-xs font-semibold mb-3">
                <School className="w-3.5 h-3.5" />
                <span>Student Leadership Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
                Campus Fest Committees & Clubs
              </h1>
              <p className="mt-2 text-base text-surface-600 max-w-2xl">
                Discover collegiate cultural boards, technical symposium teams, and entrepreneurship cells organizing high-impact youth gatherings across India.
              </p>
            </div>
            {!loading && (
              <div className="text-sm font-medium text-surface-500 whitespace-nowrap">
                Showing <span className="font-semibold text-navy-900">{pagination.total || committees.length}</span> committee{pagination.total === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Filters and Controls */}
        <CommitteeFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalResults={pagination.total}
          className="mb-8"
        />

        {/* State Rendering */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading committees">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Committees"
            message={error}
            onRetry={fetchCommittees}
            className="my-12"
          />
        ) : committees.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={hasActiveFilters ? 'No Matching Committees Found' : 'No Committees Listed Yet'}
            description={
              hasActiveFilters
                ? 'Try broadening your search term or clearing the committee type and city filters.'
                : 'Student bodies are currently registering their campus profiles. Check back soon or register your committee.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={handleResetFilters}>
                  Clear All Filters
                </Button>
              ) : null
            }
            className="my-12 py-16"
          />
        ) : (
          <div>
            {/* Committees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {committees.map((committee) => {
                const id = committee._id || committee.id;
                return <CommitteeCard key={id} committee={committee} />;
              })}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-surface-200">
                <p className="text-sm text-surface-500">
                  Page <span className="font-semibold text-navy-900">{pagination.page}</span> of{' '}
                  <span className="font-semibold text-navy-900">{pagination.totalPages}</span>
                </p>
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
      </div>
    </div>
  );
}

export default Committees;
