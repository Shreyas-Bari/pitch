import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Compass, Sparkles } from 'lucide-react';
import { eventService } from '../../services/eventService';
import EventCard from '../../components/events/EventCard';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Button from '../../components/ui/Button';

export function CompanySavedEvents() {
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventService.getSavedEvents();
      // res.data can be array of populated event objects or IDs
      const list = Array.isArray(res?.data) ? res.data : [];
      setSavedEvents(list);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load saved events');
      setSavedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedEvents();
  }, []);

  const handleSaveToggle = (eventId, isNowSaved) => {
    if (!isNowSaved) {
      // Remove from list
      setSavedEvents((prev) =>
        prev.filter((e) => (typeof e === 'string' ? e !== eventId : (e._id || e.id) !== eventId))
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-pitch-blue" />
            <span>Saved Sponsorship Opportunities</span>
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Review and evaluate college fests your brand team has bookmarked for potential sponsorship.
          </p>
        </div>
        <Link to="/company/events">
          <Button variant="outline" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
            Explore More Fests
          </Button>
        </Link>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Saved Events"
          message={error}
          onRetry={fetchSavedEvents}
        />
      ) : savedEvents.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No Saved Events Yet"
          description="You haven't bookmarked any college sponsorship opportunities yet. Browse campus events and click the bookmark button on any card."
          action={
            <Link to="/company/events">
              <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
                Discover Events
              </Button>
            </Link>
          }
          className="my-10 py-16"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedEvents.map((item) => {
            // item may be an event object or { event: { ... } }
            const event = item.event || item;
            const id = event._id || event.id;
            return (
              <EventCard
                key={id}
                event={event}
                isSaved={true}
                onSaveToggle={handleSaveToggle}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CompanySavedEvents;
