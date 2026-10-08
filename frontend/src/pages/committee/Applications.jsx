import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Check, X, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export function CommitteeApplications() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);

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

  const handleAccept = async (id) => {
    try {
      setActionLoadingId(id);
      await applicationService.acceptApplication(id);
      toast.success('Application accepted! You can now coordinate via messages and proceed to MoU agreement.');
      fetchApplications();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to accept application');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoadingId(id);
      await applicationService.rejectApplication(id);
      toast.success('Application rejected.');
      fetchApplications();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to reject application');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filterStatus === 'ALL') return true;
    return app.status === filterStatus;
  });

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
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
            <Inbox className="w-6 h-6 text-pitch-blue" />
            <span>Incoming Sponsorship Applications</span>
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Review brand pitches and sponsorship applications submitted for your campus festivals.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterStatus === st
                  ? 'bg-pitch-surface-1 text-pitch-blue border-pitch-blue shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <Card className="p-6 border-slate-200">
          <div className="space-y-4">
            <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-16 bg-slate-100 animate-pulse rounded-xl" />
          </div>
        </Card>
      ) : error ? (
        <ErrorState
          title="Failed to Load Applications"
          message={error}
          onRetry={fetchApplications}
        />
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Applications Found"
          description={
            filterStatus === 'ALL'
              ? 'No brand sponsors have applied to your fests yet. Publish events to attract sponsors or invite companies directly.'
              : `No applications with ${filterStatus} status.`
          }
          className="my-10 py-16"
        />
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const company = app.companyId || {};
            const companyId = company._id || company.id;
            const event = app.eventId || {};
            const eventId = event._id || event.id;
            const isPending = app.status === 'PENDING';
            const isProcessing = actionLoadingId === app._id;

            return (
              <Card
                key={app._id}
                className="p-5 sm:p-6 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-base text-pitch-navy">
                      {companyId ? (
                        <Link
                          to={`/companies/${companyId}`}
                          className="hover:text-pitch-blue transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{company.name || 'Brand Sponsor'}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      ) : (
                        company.name || 'Brand Sponsor'
                      )}
                    </h3>
                    {getStatusBadge(app.status)}
                  </div>

                  <p className="text-xs text-slate-600">
                    Applying to Fest: <span className="font-semibold text-pitch-navy">{event.title || 'Campus Event'}</span>
                    {app.packageId?.title && ` • Package: ${app.packageId.title}`}
                  </p>

                  {app.message && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 italic max-w-xl">
                      "{app.message}"
                    </div>
                  )}

                  <div className="text-[11px] text-pitch-muted">
                    Submitted on {formatDate(app.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                  {isPending ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Check className="w-4 h-4" />}
                        disabled={isProcessing}
                        isLoading={isProcessing}
                        onClick={() => handleAccept(app._id)}
                      >
                        Accept Pitch
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<X className="w-4 h-4" />}
                        disabled={isProcessing}
                        onClick={() => handleReject(app._id)}
                      >
                        Decline
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-pitch-muted font-medium">
                      Status: {app.status}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CommitteeApplications;
