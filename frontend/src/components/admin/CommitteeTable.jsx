import React from 'react';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { GraduationCap, Eye, MapPin, Calendar } from 'lucide-react';

export function CommitteeTable({
  committees = [],
  onViewCommittee,
  pagination = null,
  onPageChange,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Committee</th>
              <th scope="col" className="py-3.5 px-4">College / University</th>
              <th scope="col" className="py-3.5 px-4">Location</th>
              <th scope="col" className="py-3.5 px-4">PITCH Deals</th>
              <th scope="col" className="py-3.5 px-4">Joined Date</th>
              <th scope="col" className="py-3.5 px-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {committees.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  No committee records found matching criteria.
                </td>
              </tr>
            ) : (
              committees.map((committee) => {
                const pitchDeals = committee.completedDealsCount || committee.stats?.completedDeals || 0;
                return (
                  <tr key={committee._id || committee.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                          {committee.logo ? (
                            <img src={committee.logo} alt={committee.committeeName} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <GraduationCap className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {committee.committeeName}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{committee.department || committee.collegeName || 'Student Body'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 text-xs truncate max-w-[200px] block">
                        {committee.collegeName || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{committee.location?.city ? `${committee.location.city}, ${committee.location.state || ''}` : committee.location || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="success">
                          {pitchDeals} PITCH {pitchDeals === 1 ? 'Deal' : 'Deals'}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(committee.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right pr-6 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewCommittee && onViewCommittee(committee)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View committee profile"
                        aria-label="View committee profile"
                      >
                        <Eye className="w-4 h-4" />
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

export default CommitteeTable;
