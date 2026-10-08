import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import EventTable from '../../components/admin/EventTable';
import Dialog from '../../components/ui/Dialog';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatDate';
import { EVENT_STATUS } from '../../utils/constants';
import { Search, Calendar, MapPin, Tag } from 'lucide-react';

export function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [moderateModalOpen, setModerateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();

  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      };

      const res = await adminService.getEvents(params);
      const list = res?.data || res?.events || res || [];
      setEvents(Array.isArray(list) ? list : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not load events moderation list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents(1);
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setDetailModalOpen(true);
  };

  const handleOpenModerateModal = (event) => {
    setSelectedEvent(event);
    setNewStatus(event.status || EVENT_STATUS.PUBLISHED);
    setModerateModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedEvent || !newStatus) return;
    try {
      setActionLoading(true);
      await adminService.updateEventStatus(selectedEvent._id || selectedEvent.id, newStatus);
      toast.success(`Event status updated to ${newStatus}`);
      setModerateModalOpen(false);
      fetchEvents(pagination.page);
    } catch (err) {
      console.error('Failed to moderate event:', err);
      toast.error(err?.response?.data?.message || 'Failed to update event status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          Campus Event Moderation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, approve, publish, or archive campus events listed by verified college committees.
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
            placeholder="Search events by title or description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-pitch-blue focus:ring-1 focus:ring-pitch-blue"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-pitch-blue"
          >
            <option value="">All Statuses</option>
            <option value={EVENT_STATUS.PUBLISHED}>Published</option>
            <option value={EVENT_STATUS.ONGOING}>Ongoing</option>
            <option value={EVENT_STATUS.COMPLETED}>Completed</option>
            <option value={EVENT_STATUS.DRAFT}>Draft</option>
            <option value={EVENT_STATUS.ARCHIVED}>Archived</option>
          </select>

          <Button type="button" variant="outline" size="sm" onClick={() => fetchEvents(1)}>
            Apply
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoading message="Loading event listings for moderation..." />
      ) : error ? (
        <ErrorState title="Failed to load events" message={error} onRetry={() => fetchEvents(pagination.page)} />
      ) : (
        <EventTable
          events={events}
          onViewEvent={handleViewEvent}
          onModerateEvent={handleOpenModerateModal}
          pagination={pagination}
          onPageChange={(page) => fetchEvents(page)}
        />
      )}

      {/* View Event Detail Modal */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Event Inspection"
      >
        {selectedEvent && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {selectedEvent.committeeId?.committeeName || selectedEvent.committeeName} • {selectedEvent.committeeId?.collegeName || selectedEvent.collegeName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-800">{selectedEvent.category || 'General'}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Status</span>
                <span className="font-semibold text-slate-800">{selectedEvent.status}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Location Mode</span>
                <span className="font-semibold text-slate-800">{selectedEvent.locationMode || 'PHYSICAL'}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Dates</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(selectedEvent.startDate)} - {formatDate(selectedEvent.endDate)}
                </span>
              </div>
            </div>

            {selectedEvent.description && (
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Event Overview</span>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedEvent.description}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Moderate Status Modal */}
      <Dialog
        isOpen={moderateModalOpen}
        onClose={() => setModerateModalOpen(false)}
        title="Moderate Event Status"
      >
        {selectedEvent && (
          <div className="space-y-4 text-sm text-slate-700">
            <p className="text-slate-600">
              Set administrative status for event <strong className="text-slate-900">{selectedEvent.title}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Moderation Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-pitch-blue"
              >
                <option value={EVENT_STATUS.PUBLISHED}>PUBLISHED (Visible on public marketplace)</option>
                <option value={EVENT_STATUS.ARCHIVED}>ARCHIVED (Hidden / Delisted)</option>
                <option value={EVENT_STATUS.COMPLETED}>COMPLETED (Event has concluded)</option>
                <option value={EVENT_STATUS.DRAFT}>DRAFT (Hidden from public listing)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
              <strong>Audit Notice:</strong> This action will be recorded in the system audit log with your administrator ID and timestamp.
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModerateModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateStatus} loading={actionLoading}>
                Save Status
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default AdminEvents;
