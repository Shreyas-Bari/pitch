import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Globe,
  Archive,
  ArrowRight,
  ExternalLink,
  Users,
  Clock,
  Sparkles
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

export function CommitteeEvents() {
  const navigate = useNavigate();
  const toast = useToast();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('ALL');

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await eventService.getMyEvents();
      const list = Array.isArray(res?.data) ? res.data : res?.events || [];
      setEvents(list);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load committee events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handlePublish = async (id) => {
    try {
      setActionLoadingId(id);
      await eventService.publishEvent(id);
      toast.success('Event published! It is now visible on the public sponsorship marketplace.');
      fetchMyEvents();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to publish event');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnpublish = async (id) => {
    try {
      setActionLoadingId(id);
      await eventService.unpublishEvent(id);
      toast.success('Event unpublished (reverted to DRAFT).');
      fetchMyEvents();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to unpublish event');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    try {
      setDeleting(true);
      await eventService.deleteEvent(deleteTargetId);
      toast.success('Event deleted successfully.');
      setDeleteTargetId(null);
      fetchMyEvents();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterTab === 'ALL') return true;
    return e.status === filterTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published (Live)</Badge>;
      case 'DRAFT':
        return <Badge variant="warning">Draft</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">Completed</Badge>;
      case 'ARCHIVED':
        return <Badge variant="default">Archived</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pitch-blue" />
            <span>Campus Event Management</span>
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Create, edit, and publish college fests, competitions, and conferences to attract corporate sponsors.
          </p>
        </div>
        <Link to="/committee/events/create">
          <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create New Event
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['ALL', 'PUBLISHED', 'DRAFT', 'COMPLETED', 'ARCHIVED'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterTab(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterTab === tab
                ? 'bg-pitch-surface-1 text-pitch-blue border-pitch-blue shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab === 'ALL' ? 'All Events' : tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {loading ? (
        <Card className="p-6 border-slate-200">
          <div className="space-y-4">
            <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
          </div>
        </Card>
      ) : error ? (
        <ErrorState
          title="Failed to Load Events"
          message={error}
          onRetry={fetchMyEvents}
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={filterTab === 'ALL' ? 'No Campus Events Created Yet' : `No ${filterTab} Events`}
          description={
            filterTab === 'ALL'
              ? 'Start by creating your first festival, competition, or hackathon to attract brand sponsorships.'
              : `You have no campus events matching the ${filterTab} status.`
          }
          action={
            <Link to="/committee/events/create">
              <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Create New Event
              </Button>
            </Link>
          }
          className="my-10 py-16"
        />
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((evt) => {
            const id = evt._id || evt.id;
            const isProcessing = actionLoadingId === id;

            return (
              <Card
                key={id}
                className="p-5 sm:p-6 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/committee/events/${id}`}
                      className="font-bold text-base text-pitch-navy hover:text-pitch-blue transition-colors truncate"
                    >
                      {evt.title}
                    </Link>
                    {getStatusBadge(evt.status)}
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {evt.category || 'Festival'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {evt.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-pitch-muted">
                    <span>Date: {formatDate(evt.eventDate || evt.startDate)}</span>
                    <span>Reach: {evt.estimatedReach?.toLocaleString() || 'Campus'}</span>
                    <span>Mode: {evt.location?.mode || 'PHYSICAL'}</span>
                  </div>
                </div>

                {/* Lifecycle Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                  <Link to={`/committee/events/${id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                      Manage
                    </Button>
                  </Link>

                  <Link to={`/committee/events/${id}/edit`}>
                    <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                      Edit
                    </Button>
                  </Link>

                  {evt.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isProcessing}
                      isLoading={isProcessing}
                      onClick={() => handlePublish(id)}
                    >
                      Publish
                    </Button>
                  )}

                  {evt.status === 'PUBLISHED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                      isLoading={isProcessing}
                      onClick={() => handleUnpublish(id)}
                    >
                      Unpublish
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => setDeleteTargetId(id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTargetId && (
        <ConfirmationDialog
          isOpen={Boolean(deleteTargetId)}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Campus Event?"
          message="Are you sure you want to delete this event? This action cannot be undone. Any pending applications will be cancelled."
          confirmLabel="Yes, Delete"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={deleting}
        />
      )}
    </div>
  );
}

export default CommitteeEvents;
