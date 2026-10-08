import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import ReportTable from '../../components/admin/ReportTable';
import Dialog from '../../components/ui/Dialog';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatDate';
import { REPORT_STATUS, REPORT_TARGET_TYPE } from '../../utils/constants';
import { ShieldAlert, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export function AdminReports() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  // Modals
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState(REPORT_STATUS.RESOLVED);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { toast } = useToast();

  const fetchReports = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(targetTypeFilter ? { targetType: targetTypeFilter } : {}),
      };

      const res = await adminService.getReports(params);
      const list = res?.data || res?.reports || res || [];
      setReports(Array.isArray(list) ? list : []);
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch platform reports:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not load reports list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1);
  }, [statusFilter, targetTypeFilter]);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDetailModalOpen(true);
  };

  const handleOpenResolveModal = (report) => {
    setSelectedReport(report);
    setResolutionStatus(report.status === REPORT_STATUS.OPEN ? REPORT_STATUS.UNDER_REVIEW : REPORT_STATUS.RESOLVED);
    setResolutionNotes(report.resolution || '');
    setResolveModalOpen(true);
  };

  const handleUpdateReport = async () => {
    if (!selectedReport || !resolutionStatus) return;
    try {
      setActionLoading(true);
      await adminService.updateReport(selectedReport._id || selectedReport.id, {
        status: resolutionStatus,
        resolution: resolutionNotes.trim(),
      });
      toast.success(`Report status updated to ${resolutionStatus}`);
      setResolveModalOpen(false);
      fetchReports(pagination.page);
    } catch (err) {
      console.error('Failed to update report resolution:', err);
      toast.error(err?.response?.data?.message || 'Failed to update report status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          Reports & Dispute Moderation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review community incident reports, dispute tickets, and enforce platform trust & safety guidelines.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-pitch-blue"
          >
            <option value="">All Statuses</option>
            <option value={REPORT_STATUS.OPEN}>Open</option>
            <option value={REPORT_STATUS.UNDER_REVIEW}>Under Review</option>
            <option value={REPORT_STATUS.RESOLVED}>Resolved</option>
            <option value={REPORT_STATUS.DISMISSED}>Dismissed</option>
          </select>

          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-pitch-blue"
          >
            <option value="">All Target Types</option>
            <option value={REPORT_TARGET_TYPE.USER}>User</option>
            <option value={REPORT_TARGET_TYPE.EVENT}>Event</option>
            <option value={REPORT_TARGET_TYPE.DEAL}>Deal</option>
            <option value={REPORT_TARGET_TYPE.COMPANY}>Company</option>
            <option value={REPORT_TARGET_TYPE.COMMITTEE}>Committee</option>
            <option value={REPORT_TARGET_TYPE.MESSAGE}>Message</option>
          </select>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => fetchReports(1)}>
          Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <PageLoading message="Loading reports and disputes..." />
      ) : error ? (
        <ErrorState title="Failed to load reports" message={error} onRetry={() => fetchReports(pagination.page)} />
      ) : (
        <ReportTable
          reports={reports}
          onViewReport={handleViewReport}
          onResolveReport={handleOpenResolveModal}
          pagination={pagination}
          onPageChange={(page) => fetchReports(page)}
        />
      )}

      {/* View Report Detail Modal */}
      <Dialog
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Incident Report Dossier"
      >
        {selectedReport && (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-slate-400">ID: {selectedReport._id || selectedReport.id}</span>
                <Badge variant={selectedReport.status === REPORT_STATUS.RESOLVED ? 'success' : selectedReport.status === REPORT_STATUS.OPEN ? 'danger' : 'warning'}>
                  {selectedReport.status}
                </Badge>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{selectedReport.reason}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Target Type</span>
                <span className="font-semibold text-slate-800">{selectedReport.targetType}</span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
                  Target ID: {selectedReport.targetId}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <span className="text-xs text-slate-400 block">Reporter</span>
                <span className="font-semibold text-slate-800">
                  {selectedReport.reporterUserId?.name || 'Anonymous User'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {selectedReport.reporterUserId?.email || ''}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Incident Description</span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedReport.description || 'No additional narrative description provided.'}
              </p>
            </div>

            {selectedReport.resolution && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-800 block mb-0.5">Administrative Resolution</span>
                <p className="text-emerald-900">{selectedReport.resolution}</p>
                {selectedReport.resolvedAt && (
                  <span className="text-[10px] text-emerald-600 block mt-1">
                    Resolved on: {formatDate(selectedReport.resolvedAt)}
                  </span>
                )}
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

      {/* Review / Resolve Modal */}
      <Dialog
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Review & Resolve Report"
      >
        {selectedReport && (
          <div className="space-y-4 text-sm text-slate-700">
            <p className="text-slate-600">
              Update status and record formal resolution notes for report on <strong className="text-slate-900">{selectedReport.targetType}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Moderation Status
              </label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-pitch-blue"
              >
                <option value={REPORT_STATUS.UNDER_REVIEW}>UNDER_REVIEW (Active Investigation)</option>
                <option value={REPORT_STATUS.RESOLVED}>RESOLVED (Corrective Action Enforced)</option>
                <option value={REPORT_STATUS.DISMISSED}>DISMISSED (Invalid / No Action Required)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Administrative Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="State the findings, warnings issued, or resolution applied..."
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-pitch-blue"
              />
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
              <strong>Audit Notice:</strong> Your admin decision and resolution timestamp will be logged immutably.
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResolveModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateReport} loading={actionLoading}>
                Submit Resolution
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default AdminReports;
