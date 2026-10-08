import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Bookmark,
  Send,
  Mail,
  Briefcase,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/eventService';
import { applicationService } from '../../services/applicationService';
import { invitationService } from '../../services/invitationService';
import { formatDate } from '../../utils/formatDate';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

export function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [savedCount, setSavedCount] = useState(0);
  const [applications, setApplications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [savedRes, appsRes, invsRes, eventsRes] = await Promise.allSettled([
          eventService.getSavedEvents(),
          applicationService.getApplications({ limit: 5 }),
          invitationService.getInvitations({ limit: 5 }),
          eventService.getEvents({ limit: 4 }),
        ]);

        if (isMounted) {
          if (savedRes.status === 'fulfilled') {
            const list = savedRes.value?.data || [];
            setSavedCount(Array.isArray(list) ? list.length : 0);
          }
          if (appsRes.status === 'fulfilled') {
            const list = appsRes.value?.data || appsRes.value?.applications || [];
            setApplications(Array.isArray(list) ? list : []);
          }
          if (invsRes.status === 'fulfilled') {
            const list = invsRes.value?.data || invsRes.value?.invitations || [];
            setInvitations(Array.isArray(list) ? list : []);
          }
          if (eventsRes.status === 'fulfilled') {
            const list = eventsRes.value?.data || [];
            setFeaturedEvents(Array.isArray(list) ? list : []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load workspace data');
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

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
      case 'DECLINED':
        return 'danger';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-pitch-navy font-display">
            Welcome back, {user?.name || 'Partner'}
          </h1>
          <p className="text-sm text-pitch-muted mt-1">
            Corporate Sponsorship Workspace • Track campus fests, applications, and negotiations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/company/events">
            <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
              Discover Events
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

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saved Events */}
        <Card
          hover
          onClick={() => navigate('/company/saved')}
          className="p-5 border-slate-200/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-pitch-muted">
              Saved Events
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-pitch-blue flex items-center justify-center group-hover:scale-105 transition-transform">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-display text-pitch-navy">
            {loading ? '—' : savedCount}
          </div>
          <p className="text-xs text-pitch-muted mt-1 flex items-center gap-1 group-hover:text-pitch-blue transition-colors">
            <span>View saved opportunities</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Card>

        {/* Applications */}
        <Card
          hover
          onClick={() => navigate('/company/applications')}
          className="p-5 border-slate-200/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-pitch-muted">
              Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-display text-pitch-navy">
            {loading ? '—' : applications.length}
          </div>
          <p className="text-xs text-pitch-muted mt-1 flex items-center gap-1 group-hover:text-purple-600 transition-colors">
            <span>Track application status</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Card>

        {/* Invitations */}
        <Card
          hover
          onClick={() => navigate('/company/invitations')}
          className="p-5 border-slate-200/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-pitch-muted">
              Fest Invitations
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-display text-pitch-navy">
            {loading ? '—' : invitations.length}
          </div>
          <p className="text-xs text-pitch-muted mt-1 flex items-center gap-1 group-hover:text-amber-600 transition-colors">
            <span>Review incoming invites</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Card>

        {/* Deals & MoU */}
        <Card
          hover
          onClick={() => navigate('/company/deals')}
          className="p-5 border-slate-200/90 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-pitch-muted">
              Deals & MoU
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold font-display text-pitch-navy">
            Stage 5 Hub
          </div>
          <p className="text-xs text-pitch-muted mt-1 flex items-center gap-1 group-hover:text-emerald-600 transition-colors">
            <span>Contract negotiations</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Card>
      </div>

      {/* 2-Column Main Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Applications & Invitations */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Applications */}
          <Card className="p-6 border-slate-200/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-pitch-blue" />
                <h2 className="font-display font-bold text-base text-pitch-navy">
                  Recent Sponsorship Applications
                </h2>
              </div>
              <Link
                to="/company/applications"
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
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-pitch-muted">
                  No active sponsorship applications. Browse campus fests and submit your brand pitch.
                </p>
                <div className="mt-4">
                  <Link to="/company/events">
                    <Button variant="outline" size="sm">
                      Explore Campus Events
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 4).map((app) => {
                  const event = app.eventId || {};
                  return (
                    <div key={app._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-pitch-navy truncate">
                          {event.title || 'Campus Event Application'}
                        </h4>
                        <p className="text-xs text-pitch-muted mt-0.5">
                          {app.packageId?.title || 'Custom Sponsorship Pitch'} • {formatDate(app.createdAt)}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status || 'PENDING'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pending Invitations */}
          <Card className="p-6 border-slate-200/90">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600" />
                <h2 className="font-display font-bold text-base text-pitch-navy">
                  Campus Fest Invitations
                </h2>
              </div>
              <Link
                to="/company/invitations"
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
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-pitch-muted">
                  No invitations from student committees at this time.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invitations.slice(0, 4).map((inv) => {
                  const event = inv.eventId || {};
                  const committee = inv.committeeId || {};
                  return (
                    <div key={inv._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-pitch-navy truncate">
                          {event.title || 'Campus Fest Invitation'}
                        </h4>
                        <p className="text-xs text-pitch-muted mt-0.5">
                          From: {committee.name || 'Student Committee'} • {formatDate(inv.createdAt)}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(inv.status)}>
                        {inv.status || 'PENDING'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (4 cols): Quick actions & Protocol notice */}
        <div className="lg:col-span-4 space-y-6">
          {/* Brand Profile Status */}
          <Card className="p-6 border-slate-200/90 bg-gradient-to-br from-white to-slate-50">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pitch-surface-1 text-pitch-blue flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-pitch-navy text-sm">
                  {user?.name || 'Company Profile'}
                </h3>
                <p className="text-xs text-pitch-muted mt-0.5">
                  Verified Brand Account
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Keep your sponsorship preferences, target student demographics, and contribution modes up to date to receive relevant invitations.
            </p>

            <Link to="/company/profile">
              <Button variant="outline" size="sm" className="w-full">
                Manage Company Profile
              </Button>
            </Link>
          </Card>

          {/* Platform Protocol Card */}
          <Card className="p-5 border-slate-200/90 bg-slate-50">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-pitch-blue shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-pitch-navy block mb-1">
                  PITCH Governance Protocol
                </span>
                Direct banking/UPI settlements happen between brand and college (no platform escrow). All agreed deliverables are digitally memorialized in the official MoU for fulfillment validation.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CompanyDashboard;
