import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck, Plus, X, ExternalLink, Calendar, Building2 } from 'lucide-react';
import { invitationService } from '../../services/invitationService';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';

export function CommitteeInvitations() {
  const toast = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await invitationService.getInvitations();
      const list = Array.isArray(res?.data) ? res.data : res?.invitations || [];
      setInvitations(list);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to load invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCancelConfirm = async () => {
    if (!cancelTargetId) return;

    try {
      setCancelling(true);
      await invitationService.cancelInvitation(cancelTargetId);
      toast.success('Invitation cancelled successfully');
      setCancelTargetId(null);
      fetchInvitations();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to cancel invitation');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge variant="success">Accepted</Badge>;
      case 'DECLINED':
        return <Badge variant="danger">Declined</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="default">Expired</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="warning">Awaiting Response</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
            <MailCheck className="w-6 h-6 text-pitch-blue" />
            <span>Outreach Sponsorship Invitations</span>
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Track sponsorship invitations sent by your committee to target corporate brands.
          </p>
        </div>
        <Link to="/committee/companies">
          <Button variant="primary" size="sm" leftIcon={<Building2 className="w-4 h-4" />}>
            Explore Brands to Invite
          </Button>
        </Link>
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
          title="Failed to Load Invitations"
          message={error}
          onRetry={fetchInvitations}
        />
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={MailCheck}
          title="No Invitations Sent Yet"
          description="Your committee has not sent any invitations to corporate sponsors. Browse the companies directory to invite brands to sponsor your fest."
          action={
            <Link to="/committee/companies">
              <Button variant="primary" size="sm" leftIcon={<Building2 className="w-4 h-4" />}>
                Browse Companies
              </Button>
            </Link>
          }
          className="my-10 py-16"
        />
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => {
            const company = inv.companyId || {};
            const companyId = company._id || company.id;
            const event = inv.eventId || {};
            const isPending = inv.status === 'PENDING';

            return (
              <Card
                key={inv._id}
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
                    {getStatusBadge(inv.status)}
                  </div>

                  <p className="text-xs text-slate-600">
                    Invited to Fest: <span className="font-semibold text-pitch-navy">{event.title || 'Campus Event'}</span>
                  </p>

                  {inv.message && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 italic max-w-xl">
                      "{inv.message}"
                    </div>
                  )}

                  <div className="text-[11px] text-pitch-muted">
                    Sent on {formatDate(inv.createdAt)}
                    {inv.expiresAt && ` • Expires on ${formatDate(inv.expiresAt)}`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                  {isPending ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 text-xs"
                      onClick={() => setCancelTargetId(inv._id)}
                    >
                      Cancel Invitation
                    </Button>
                  ) : (
                    <span className="text-xs text-pitch-muted font-medium">
                      Status: {inv.status}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog for Cancellation */}
      {cancelTargetId && (
        <ConfirmationDialog
          isOpen={Boolean(cancelTargetId)}
          onClose={() => setCancelTargetId(null)}
          onConfirm={handleCancelConfirm}
          title="Cancel Fest Invitation?"
          message="Are you sure you want to cancel this sponsorship invitation? The company will no longer be able to accept it."
          confirmLabel="Yes, Cancel Invite"
          cancelLabel="Keep Active"
          variant="danger"
          isLoading={cancelling}
        />
      )}
    </div>
  );
}

export default CommitteeInvitations;
