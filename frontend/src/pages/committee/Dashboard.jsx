import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  PlusCircle,
  Inbox,
  MailCheck,
  Briefcase,
  ArrowRight,
  GraduationCap,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { applicationService } from '../../services/applicationService';
import { invitationService } from '../../services/invitationService';
import { formatDate } from '../../utils/formatDate';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export function CommitteeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [eventsRes, appsRes, invsRes] = await Promise.allSettled([
          eventService.getMyEvents(),
          applicationService.getApplications({ limit: 5 }),
          invitationService.getInvitations({ limit: 5 }),
        ]);

        if (isMounted) {
          if (eventsRes.status === 'fulfilled') {
            const list = eventsRes.value?.data || eventsRes.value?.events || [];
            setEvents(Array.isArray(list) ? list : []);
          }
          if (appsRes.status === 'fulfilled') {
            const list = appsRes.value?.data || appsRes.value?.applications || [];
            setApplications(Array.isArray(list) ? list : []);
          }
          if (invsRes.status === 'fulfilled') {
            const list = invsRes.value?.data || invsRes.value?.invitations || [];
            setInvitations(Array.isArray(list) ? list : []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load committee workspace');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const publishedCount = events.filter((e) => e.status === 'PUBLISHED').length;
  const draftCount = events.filter((e) => e.status === 'DRAFT').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'DRAFT':
        return <Badge variant="warning">Draft</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pitch-navy font-display">
            Welcome, {user?.name || 'Student Committee'}
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Campus Organizer Workspace • Manage your festivals, sponsorship tiers, and incoming brand pitches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/committee/events/create">
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Event
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <ErrorState
          title="Dashboard Sync Notice"
          message={error}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Published Events */}
        <Card
          hover
          onClick={() => navigate('/committee/events')}
          className="p-5 border-slate-200/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-pitch-muted">
              Published Fests
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-display text-pitch-navy">
            {loading ? '—' : publishedCount}
          </div>
          <p className="text-xs text-pitch-muted mt-1 flex items-center gap-1 group-hover:text-emerald-600 transition-colors">
            <span>Live on marketplace</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Card>

        {/* Draft Events */}
        <Card
          hover
          onClick={() => navigate('/committee/events')}
          className="p-5 border-slate-200/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-pitch-muted">
              Draft Opportunities
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-display text-pitch-navy">
            {loading ? '—' : draftCount}
          </div>
          <p className="text-xs text-pitch-muted mt-1 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
            <span>Ready to publish</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Card>

        {/* Received Applications */}
        <Card
          hover
          onClick={() => navigate('/committee/applications')}
          className="p-5 border-slate-200/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-pitch-muted">
              Brand Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-display text-pitch-navy">
            {loading ? '—' : applications.length}
          </div>
          <p className="text-xs text-pitch-muted mt-1 flex items-center gap-1 group-hover:text-purple-600 transition-colors">
            <span>Review sponsor pitches</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Card>

        {/* Sent Invitations */}
        <Card
          hover
          onClick={() => navigate('/committee/invitations')}
          className="p-5 border-slate-200/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-pitch-muted">
              Outreach Invites
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-pitch-blue flex items-center justify-center group-hover:scale-105 transition-transform">
              <MailCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-display text-pitch-navy">
            {loading ? '—' : invitations.length}
          </div>
          <p className="text-xs text-pitch-muted mt-1 flex items-center gap-1 group-hover:text-pitch-blue transition-colors">
            <span>Track brand invites</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Card>
      </div>

      {/* 2-Column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Recent Events */}
          <Card className="p-6 border-slate-200/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pitch-blue" />
                <h2 className="font-display font-bold text-base text-pitch-navy">
                  My Campus Events
                </h2>
              </div>
              <Link
                to="/committee/events"
                className="text-xs font-semibold text-pitch-blue hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
                <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-pitch-muted">
                  No campus events created yet. Publish your festival to start attracting corporate sponsors.
                </p>
                <div className="mt-4">
                  <Link to="/committee/events/create">
                    <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                      Create Your First Event
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {events.slice(0, 4).map((evt) => {
                  const id = evt._id || evt.id;
                  return (
                    <div key={id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          to={`/committee/events/${id}`}
                          className="font-bold text-sm text-pitch-navy hover:text-pitch-blue transition-colors truncate block"
                        >
                          {evt.title}
                        </Link>
                        <p className="text-xs text-pitch-muted mt-0.5">
                          {evt.category || 'Festival'} • {formatDate(evt.eventDate || evt.startDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        {getStatusBadge(evt.status)}
                        <Link to={`/committee/events/${id}`}>
                          <Button variant="ghost" size="sm" className="text-xs">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Recent Applications Received */}
          <Card className="p-6 border-slate-200/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-purple-600" />
                <h2 className="font-display font-bold text-base text-pitch-navy">
                  Recent Applications Received
                </h2>
              </div>
              <Link
                to="/committee/applications"
                className="text-xs font-semibold text-pitch-blue hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 py-2">
                <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-pitch-muted">
                  No applications received yet. Once brands discover your published fests, their proposals will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 4).map((app) => {
                  const company = app.companyId || {};
                  const event = app.eventId || {};
                  return (
                    <div key={app._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-pitch-navy truncate">
                          {company.name || 'Brand Partner'}
                        </h4>
                        <p className="text-xs text-pitch-muted mt-0.5">
                          Applying for: {event.title || 'Event'} • {formatDate(app.createdAt)}
                        </p>
                      </div>
                      <Badge variant={app.status === 'ACCEPTED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {app.status || 'PENDING'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Committee Card */}
          <Card className="p-6 border-slate-200/90 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pitch-surface-1 text-pitch-blue flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-pitch-navy text-sm">
                  {user?.name || 'Student Committee'}
                </h3>
                <p className="text-xs text-pitch-muted mt-0.5">
                  Official Campus Organizer
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Keep your committee profile and past fest achievements up to date to build credible sponsorship reputation with brands.
            </p>

            <Link to="/committee/profile">
              <Button variant="outline" size="sm" className="w-full">
                Manage Committee Profile
              </Button>
            </Link>
          </Card>

          {/* Deal Protocol Card */}
          <Card className="p-5 border-slate-200/90 bg-slate-50">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-pitch-blue shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-pitch-navy block mb-1">
                  PITCH Governance Protocol
                </span>
                Sponsorship funds transfer directly into your college account (no escrow fees). Every agreed deliverable is tracked through the platform MoU and post-fest reviews.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CommitteeDashboard;
