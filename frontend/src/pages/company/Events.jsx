import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';
import { eventService } from '../../services/eventService';
import useDebounce from '../../hooks/useDebounce';
import EventCard from '../../components/events/EventCard';
import EventFilters from '../../components/events/EventFilters';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';

export function CompanyEvents() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    eventType: searchParams.get('eventType') || '',
    locationMode: searchParams.get('locationMode') || '',
    city: searchParams.get('city') || '',
    sort: searchParams.get('sort') || 'eventDate',
    order: searchParams.get('order') || 'asc',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12,
  }));

  const debouncedSearch = useDebounce(filters.search, 400);

  const [events, setEvents] = useState([]);
  const [savedEventIds, setSavedEventIds] = useState(new Set());
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
    if (filters.category) params.set('category', filters.category);
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.locationMode) params.set('locationMode', filters.locationMode);
    if (filters.city) params.set('city', filters.city);
    if (filters.sort && filters.sort !== 'eventDate') params.set('sort', filters.sort);
    if (filters.order && filters.order !== 'asc') params.set('order', filters.order);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Load saved event IDs
  useEffect(() => {
    let isMounted = true;
    eventService
      .getSavedEvents()
      .then((res) => {
        if (isMounted && res?.data) {
          const ids = new Set((res.data || []).map((e) => (typeof e === 'string' ? e : e._id || e.id)));
          setSavedEventIds(ids);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = {
        category: filters.category || undefined,
        eventType: filters.eventType || undefined,
        locationMode: filters.locationMode || undefined,
        city: filters.city || undefined,
        sort: filters.sort,
        order: filters.order,
        page: filters.page,
        limit: filters.limit,
      };

      if (debouncedSearch && debouncedSearch.trim()) {
        queryParams.search = debouncedSearch.trim();
      }

      const res = await eventService.getEvents(queryParams);
      const eventList = Array.isArray(res?.data) ? res.data : [];
      setEvents(eventList);

      if (res?.pagination) {
        setPagination(res.pagination);
      } else {
        setPagination({
          page: filters.page,
          limit: filters.limit,
          total: eventList.length,
          totalPages: Math.max(1, Math.ceil(eventList.length / filters.limit)),
        });
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filters.category,
    filters.eventType,
    filters.locationMode,
    filters.city,
    filters.sort,
    filters.order,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      eventType: '',
      locationMode: '',
      city: '',
      sort: 'eventDate',
      order: 'asc',
      page: 1,
      limit: 12,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToggle = (eventId, isNowSaved) => {
    setSavedEventIds((prev) => {
      const next = new Set(prev);
      if (isNowSaved) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      return next;
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.category || filters.eventType || filters.locationMode || filters.city
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-pitch-navy font-display">
              Discover Campus Sponsorships
            </h1>
            <p className="text-sm text-pitch-muted mt-1">
              Browse verified college fests, review sponsorship tiers, and bookmark opportunities for your brand pipeline.
            </p>
          </div>
          {!loading && (
            <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
              {pagination.total || events.length} Active Fest{pagination.total === 1 ? '' : 's'}
            </div>
          )}
        </div>
      </div>

      {/* Discovery Filters */}
      <EventFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={pagination.total}
      />

      {/* Grid States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Events"
          message={error}
          onRetry={fetchEvents}
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={hasActiveFilters ? 'No Matching Opportunities Found' : 'No Events Available'}
          description={
            hasActiveFilters
              ? 'Try broadening your search keywords or resetting your active category filters.'
              : 'There are currently no published college events looking for corporate sponsors.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : null
          }
          className="my-8 py-16"
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const id = event._id || event.id;
              return (
                <EventCard
                  key={id}
                  event={event}
                  isSaved={savedEventIds.has(id)}
                  onSaveToggle={handleSaveToggle}
                />
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
    </div>
  );
}

export default CompanyEvents;
