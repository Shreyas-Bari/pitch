import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Compass, ExternalLink, Trash2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

export function CompanyApplications() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [withdrawTargetId, setWithdrawTargetId] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationService.getApplications();
      const list = Array.isArray(res?.data) ? res.data : res?.applications || [];
      setApplications(list);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdrawConfirm = async () => {
    if (!withdrawTargetId) return;

    try {
      setWithdrawing(true);
      await applicationService.withdrawApplication(withdrawTargetId);
      toast.success('Application withdrawn successfully');
      setWithdrawTargetId(null);
      fetchApplications();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="success">Accepted</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Declined</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="default">Withdrawn</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="warning">Pending Review</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
            <Send className="w-6 h-6 text-pitch-blue" />
            <span>Sponsorship Applications</span>
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Track pitches submitted to campus event organizers, review committee responses, and manage proposals.
          </p>
        </div>
        <Link to="/company/events">
          <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
            Apply to New Event
          </Button>
        </Link>
      </div>

      {/* Main Table / List */}
      {loading ? (
        <Card className="p-6 border-slate-200">
          <div className="space-y-4">
            <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
          </div>
        </Card>
      ) : error ? (
        <ErrorState
          title="Failed to Load Applications"
          message={error}
          onRetry={fetchApplications}
        />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No Applications Submitted"
          description="Your brand has not submitted any sponsorship applications yet. Browse campus festivals to pitch your brand."
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
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-pitch-muted font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Event & Committee</th>
                  <th className="py-3 px-4">Package / Pitch</th>
                  <th className="py-3 px-4">Date Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const event = app.eventId || {};
                  const eventId = event._id || event.id;
                  const committee = event.committeeId || {};

                  return (
                    <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Event Column */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-pitch-navy hover:text-pitch-blue transition-colors">
                          {eventId ? (
                            <Link to={`/company/events/${eventId}`} className="inline-flex items-center gap-1">
                              <span>{event.title || 'Event'}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                          ) : (
                            event.title || 'Event'
                          )}
                        </div>
                        <div className="text-xs text-pitch-muted mt-0.5">
                          {committee.name || 'Campus Committee'}
                        </div>
                      </td>

                      {/* Package Column */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-semibold text-xs text-pitch-navy">
                          {app.packageId?.title || 'Custom Proposal'}
                        </div>
                        {app.message && (
                          <div className="text-xs text-pitch-muted truncate max-w-xs mt-0.5">
                            "{app.message}"
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-pitch-muted whitespace-nowrap">
                        {formatDate(app.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(app.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {app.status === 'PENDING' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 text-xs"
                            onClick={() => setWithdrawTargetId(app._id)}
                          >
                            Withdraw
                          </Button>
                        ) : app.status === 'ACCEPTED' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Link to="/messages">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary-700 hover:bg-primary-50 text-xs font-semibold"
                              >
                                Chat
                              </Button>
                            </Link>
                            <Link to="/company/deals">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              >
                                View Deal
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog for Withdrawing */}
      {withdrawTargetId && (
        <ConfirmationDialog
          isOpen={Boolean(withdrawTargetId)}
          onClose={() => setWithdrawTargetId(null)}
          onConfirm={handleWithdrawConfirm}
          title="Withdraw Sponsorship Application?"
          message="Are you sure you want to withdraw this application? The student committee will be notified that your interest has been withdrawn."
          confirmLabel="Yes, Withdraw"
          cancelLabel="Keep Active"
          variant="danger"
          isLoading={withdrawing}
        />
      )}
    </div>
  );
}

export default CompanyApplications;
