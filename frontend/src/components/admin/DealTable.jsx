import React from 'react';
import DealStatusBadge from '../deals/DealStatusBadge';
import { formatDate } from '../../utils/formatDate';
import { Eye, Handshake, ArrowRight } from 'lucide-react';

export function DealTable({
  deals = [],
  onViewDeal,
  pagination = null,
  onPageChange,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Participants</th>
              <th scope="col" className="py-3.5 px-4">Event</th>
              <th scope="col" className="py-3.5 px-4">Deal Status</th>
              <th scope="col" className="py-3.5 px-4">Last Updated</th>
              <th scope="col" className="py-3.5 px-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {deals.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  No deals found matching current filter parameters.
                </td>
              </tr>
            ) : (
              deals.map((deal) => {
                const companyName = deal.companyId?.companyName || deal.companyName || 'Brand Sponsor';
                const committeeName = deal.committeeId?.committeeName || deal.committeeName || 'Campus Committee';
                const eventTitle = deal.eventId?.title || deal.eventTitle || 'Campus Event';

                return (
                  <tr key={deal._id || deal.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-pitch-blue border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                          <Handshake className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                            <span className="text-pitch-blue font-medium">{companyName}</span>
                            <span className="text-slate-400 font-normal">🤝</span>
                            <span className="text-emerald-700 font-medium">{committeeName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {(deal._id || deal.id)?.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 text-xs truncate max-w-[220px]">
                        {eventTitle}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <DealStatusBadge status={deal.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(deal.updatedAt || deal.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right pr-6 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDeal && onViewDeal(deal)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-pitch-blue hover:text-white bg-blue-50 hover:bg-pitch-blue rounded-lg transition-colors border border-blue-200"
                        title="Inspect deal history and records"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
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

export default DealTable;
