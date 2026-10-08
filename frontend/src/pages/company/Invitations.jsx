import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, X, ExternalLink, Calendar, MapPin, Building2 } from 'lucide-react';
import { invitationService } from '../../services/invitationService';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export function CompanyInvitations() {
  const toast = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

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

  const handleAccept = async (id) => {
    try {
      setActionLoadingId(id);
      await invitationService.acceptInvitation(id);
      toast.success('Invitation accepted! The student committee has been notified.');
      fetchInvitations();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to accept invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (id) => {
    try {
      setActionLoadingId(id);
      await invitationService.declineInvitation(id);
      toast.success('Invitation declined.');
      fetchInvitations();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || err.message || 'Failed to decline invitation');
    } finally {
      setActionLoadingId(null);
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
        return <Badge variant="warning">Pending Response</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-pitch-navy font-display flex items-center gap-2">
          <Mail className="w-6 h-6 text-pitch-blue" />
          <span>Campus Fest Invitations</span>
        </h1>
        <p className="text-sm text-pitch-muted mt-1">
          Review direct sponsorship invitations sent by college committees to your brand.
        </p>
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
          icon={Mail}
          title="No Invitations Received"
          description="Your company currently has no direct invitations from campus committees. As committees discover your brand profile, invitations will arrive here."
          className="my-10 py-16"
        />
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => {
            const event = inv.eventId || {};
            const eventId = event._id || event.id;
            const committee = inv.committeeId || {};
            const isPending = inv.status === 'PENDING';
            const isProcessing = actionLoadingId === inv._id;

            return (
              <Card
                key={inv._id}
                className="p-5 sm:p-6 border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-pitch-navy">
                      {eventId ? (
                        <Link
                          to={`/company/events/${eventId}`}
                          className="hover:text-pitch-blue transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{event.title || 'Campus Event'}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      ) : (
                        event.title || 'Campus Event'
                      )}
                    </h3>
                    {getStatusBadge(inv.status)}
                  </div>

                  <p className="text-xs text-slate-600">
                    Organized by: <span className="font-semibold text-pitch-navy">{committee.name || 'Student Committee'}</span>
                    {committee.college?.name && ` • ${committee.college.name}`}
                  </p>

                  {inv.message && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 italic max-w-xl">
                      "{inv.message}"
                    </div>
                  )}

                  <div className="text-[11px] text-pitch-muted flex items-center gap-4">
                    <span>Received on {formatDate(inv.createdAt)}</span>
                    {inv.expiresAt && <span>Expires on {formatDate(inv.expiresAt)}</span>}
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
                        onClick={() => handleAccept(inv._id)}
                      >
                        Accept Invite
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<X className="w-4 h-4" />}
                        disabled={isProcessing}
                        onClick={() => handleDecline(inv._id)}
                      >
                        Decline
                      </Button>
                    </>
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
    </div>
  );
}

export default CompanyInvitations;
