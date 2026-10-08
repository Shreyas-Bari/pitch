import React from 'react';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatDate';
import { REPORT_STATUS } from '../../utils/constants';
import { ShieldAlert, Eye, CheckCircle2 } from 'lucide-react';

export function ReportTable({
  reports = [],
  onViewReport,
  onResolveReport,
  pagination = null,
  onPageChange,
}) {
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case REPORT_STATUS.OPEN:
        return 'danger';
      case REPORT_STATUS.UNDER_REVIEW:
        return 'warning';
      case REPORT_STATUS.RESOLVED:
        return 'success';
      case REPORT_STATUS.DISMISSED:
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
              <th scope="col" className="py-3.5 px-4 sm:px-6">Report / Reason</th>
              <th scope="col" className="py-3.5 px-4">Target Type</th>
              <th scope="col" className="py-3.5 px-4">Reporter</th>
              <th scope="col" className="py-3.5 px-4">Status</th>
              <th scope="col" className="py-3.5 px-4">Submitted Date</th>
              <th scope="col" className="py-3.5 px-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {reports.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  No active reports or dispute cases logged.
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report._id || report.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold text-xs shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {report.reason}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {(report._id || report.id)?.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {report.targetType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 text-xs truncate">
                        {report.reporterUserId?.name || 'Anonymous User'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {report.reporterUserId?.role || 'USER'}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(report.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right pr-6 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onViewReport && onViewReport(report)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View report details"
                        aria-label="View report details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onResolveReport && onResolveReport(report)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:text-white bg-purple-50 hover:bg-purple-600 rounded-lg transition-colors border border-purple-200"
                        title="Update report status or resolution"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Review</span>
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

export default ReportTable;
