import React from 'react';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { EVENT_STATUS } from '../../utils/constants';
import { Calendar, Eye, Edit2, MapPin } from 'lucide-react';

export function EventTable({
  events = [],
  onViewEvent,
  onModerateEvent,
  pagination = null,
  onPageChange,
}) {
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case EVENT_STATUS.PUBLISHED:
        return 'success';
      case EVENT_STATUS.ONGOING:
        return 'primary';
      case EVENT_STATUS.COMPLETED:
        return 'info';
      case EVENT_STATUS.DRAFT:
        return 'warning';
      case EVENT_STATUS.ARCHIVED:
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Event</th>
              <th scope="col" className="py-3.5 px-4">Committee / College</th>
              <th scope="col" className="py-3.5 px-4">Category</th>
              <th scope="col" className="py-3.5 px-4">Status</th>
              <th scope="col" className="py-3.5 px-4">Dates</th>
              <th scope="col" className="py-3.5 px-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {events.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  No events found matching moderation criteria.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event._id || event.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                        {event.bannerImage || event.gallery?.[0] ? (
                          <img src={event.bannerImage || event.gallery[0]} alt={event.title} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Calendar className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {event.title}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{event.locationMode || 'PHYSICAL'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 text-xs truncate">
                        {event.committeeId?.committeeName || event.committeeName || 'Campus Committee'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {event.committeeId?.collegeName || event.collegeName || ''}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {event.category || 'General'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadgeVariant(event.status)}>
                      {event.status || 'DRAFT'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(event.startDate)}
                  </td>
                  <td className="py-3 px-4 text-right pr-6 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewEvent && onViewEvent(event)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View event details"
                        aria-label="View event details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onModerateEvent && onModerateEvent(event)}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Moderate event status"
                        aria-label="Moderate event status"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.totalPages}</span> ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventTable;
