import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Compass } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import EventCard from '../../components/events/EventCard';
import EventFilters from '../../components/events/EventFilters';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';

export function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Filters state initialized from URL query params or defaults
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedEventIds, setSavedEventIds] = useState(new Set());

  // Keep URL query params synchronized
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

  // Load saved event IDs if user is a Company
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated && user?.role === 'COMPANY') {
      eventService
        .getSavedEvents()
        .then((res) => {
          if (isMounted && res?.data) {
            const ids = new Set((res.data || []).map((e) => (typeof e === 'string' ? e : e._id || e.id)));
            setSavedEventIds(ids);
          }
        })
        .catch(() => {
          // Non-critical, ignore error
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  // Fetch events from backend API
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

      // Handle backend standard format { success: true, data: [...], pagination: { ... } }
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
    <div className="min-w-0 pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-primary-50/60 to-surface-0 border-b border-surface-200 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/70 text-primary-700 text-xs font-semibold mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>Live Sponsorship Discovery</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
                Campus Sponsorship Opportunities
              </h1>
              <p className="mt-2 text-base text-surface-600 max-w-2xl">
                Explore verified college festivals, hackathons, and academic summits across India actively seeking corporate sponsorship partners.
              </p>
            </div>
            {!loading && (
              <div className="text-sm font-medium text-surface-500 whitespace-nowrap">
                Showing <span className="font-semibold text-navy-900">{pagination.total || events.length}</span> published event{pagination.total === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Filters and Controls */}
        <EventFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalResults={pagination.total}
          className="mb-8"
        />

        {/* State Rendering */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading events">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to Load Events"
            message={error}
            onRetry={fetchEvents}
            className="my-12"
          />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={hasActiveFilters ? 'No Matching Opportunities Found' : 'No Events Available Yet'}
            description={
              hasActiveFilters
                ? 'Try broadening your search term or clearing some category/location filters.'
                : 'Student committees have not published any sponsorship opportunities yet. Check back soon!'
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
            {/* Event Cards Grid */}
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

export default Events;
