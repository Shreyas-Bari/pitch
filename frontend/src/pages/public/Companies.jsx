import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Sparkles, Briefcase } from 'lucide-react';
import { companyService } from '../../services/companyService';
import useDebounce from '../../hooks/useDebounce';
import CompanyCard from '../../components/companies/CompanyCard';
import CompanyFilters from '../../components/companies/CompanyFilters';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';

export function Companies() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters state initialized from URL query params or defaults
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

  // Synchronize URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.industry) params.set('industry', filters.industry);
    if (filters.city) params.set('city', filters.city);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch companies from backend API
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

      // Handle backend standard format { success: true, data: [...], pagination: { ... } }
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

  const hasActiveFilters = Boolean(filters.search || filters.industry || filters.city);

  return (
    <div className="min-w-0 pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-primary-50/60 to-surface-0 border-b border-surface-200 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/70 text-primary-700 text-xs font-semibold mb-3">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Brand Discovery Directory</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
                Participating Brands & Sponsors
              </h1>
              <p className="mt-2 text-base text-surface-600 max-w-2xl">
                Explore forward-looking corporate sponsors, startups, and consumer brands actively seeking campus festival partnerships across India.
              </p>
            </div>
            {!loading && (
              <div className="text-sm font-medium text-surface-500 whitespace-nowrap">
                Showing <span className="font-semibold text-navy-900">{pagination.total || companies.length}</span> brand{pagination.total === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Filters and Controls */}
        <CompanyFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalResults={pagination.total}
          className="mb-8"
        />

        {/* State Rendering */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading companies">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Companies"
            message={error}
            onRetry={fetchCompanies}
            className="my-12"
          />
        ) : companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={hasActiveFilters ? 'No Matching Brands Found' : 'No Companies Listed Yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search terms or clearing the industry and city filters.'
                : 'Corporate sponsors are currently onboarding. Check back soon or register your brand today.'
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
            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => {
                const id = company._id || company.id;
                return <CompanyCard key={id} company={company} />;
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

export default Companies;
