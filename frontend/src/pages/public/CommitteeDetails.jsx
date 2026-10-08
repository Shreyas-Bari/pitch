import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Globe,
  Mail,
  ExternalLink,
  Sparkles,
  Award,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Users,
  Compass,
  AlertCircle
} from 'lucide-react';
import { committeeService } from '../../services/committeeService';
import { eventService } from '../../services/eventService';
import { getAvatarImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import ReputationSummary from '../../components/common/ReputationSummary';
import SelfReportedBadge from '../../components/common/SelfReportedBadge';
import EventCard from '../../components/events/EventCard';

export function CommitteeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [committee, setCommittee] = useState(null);
  const [history, setHistory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [verifiedHistory, setVerifiedHistory] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCommitteeData() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch committee profile
        const res = await committeeService.getCommittee(id);
        const committeeData = res?.data?.committee || res?.data;

        if (!committeeData && isMounted) {
          setError('Committee profile not found.');
          return;
        }

        if (isMounted) setCommittee(committeeData);

        // Concurrently fetch self-reported history, reviews, verified history, and active published events
        const [historyRes, reviewsRes, verifiedRes, eventsRes] = await Promise.allSettled([
          committeeService.getCommitteeHistory(id),
          committeeService.getCommitteeReviews(id),
          committeeService.getCommitteeVerifiedHistory(id),
          eventService.getEvents({ limit: 20 }),
        ]);

        if (isMounted) {
          if (historyRes.status === 'fulfilled') {
            const hList = historyRes.value?.data?.history || historyRes.value?.data || [];
            setHistory(Array.isArray(hList) ? hList : []);
          }
          if (reviewsRes.status === 'fulfilled') {
            const rList = reviewsRes.value?.data || reviewsRes.value?.reviews || [];
            setReviews(Array.isArray(rList) ? rList : []);
          }
          if (verifiedRes.status === 'fulfilled') {
            const vList = verifiedRes.value?.data || verifiedRes.value?.verifiedHistory || [];
            setVerifiedHistory(Array.isArray(vList) ? vList : []);
          }
          if (eventsRes.status === 'fulfilled') {
            const allEvents = Array.isArray(eventsRes.value?.data) ? eventsRes.value.data : [];
            const committeeEvents = allEvents.filter(
              (e) => (e.committeeId?._id || e.committeeId?.id || e.committeeId) === id
            );
            setActiveEvents(committeeEvents);
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err?.response?.status === 404
              ? 'This committee could not be found.'
              : err?.response?.data?.error?.message || err.message || 'Failed to load committee profile.';
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCommitteeData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <PageLoading message="Loading committee profile..." />;
  }

  if (error || !committee) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Committee Not Found"
          message={error || 'The requested committee could not be found.'}
          action={
            <Button variant="primary" onClick={() => navigate('/committees')}>
              Back to Committees Directory
            </Button>
          }
        />
      </div>
    );
  }

  const logoUrl = getAvatarImageUrl(committee);
  const college = committee.college || {};
  const collegeName = college.name || 'University Campus';
  const locationText = college.location?.city
    ? `${college.location.city}${college.location.state ? `, ${college.location.state}` : ''}`
    : 'India';

  return (
    <div className="min-w-0 pb-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Link
          to="/committees"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-600 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Committees Directory</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Profile Hero Card */}
        <Card className="p-6 sm:p-8 rounded-3xl border border-surface-200 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar
              name={committee.name}
              src={logoUrl}
              size="xl"
              variant="committee"
              className="rounded-2xl border-2 border-surface-200 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
                    {committee.name}
                  </h1>
                  <p className="text-sm font-semibold text-primary-600 flex items-center gap-1.5 mt-1">
                    <GraduationCap className="w-4 h-4" />
                    <span>{collegeName}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                    {committee.committeeType || 'Student Body'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500 mt-3 pt-3 border-t border-surface-100">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-surface-400" />
                  <span>{locationText}</span>
                </span>
                {committee.socialLinks?.website && (
                  <a
                    href={committee.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Campus Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Overview / About */}
            <Card className="p-6 sm:p-8 rounded-2xl border border-surface-200">
              <h2 className="text-xl font-bold text-navy-950 mb-4">
                About the Committee
              </h2>
              <div className="prose prose-slate max-w-none text-surface-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {committee.description ||
                  'This student body has not provided an extended description. They represent official campus leadership organizing collegiate gatherings, hackathons, and festivals.'}
              </div>
            </Card>

            {/* Active Published Opportunities by this Committee */}
            {activeEvents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-primary-600" />
                    <h3 className="text-xl font-bold text-navy-950">
                      Active Campus Events
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-surface-500">
                    {activeEvents.length} Open Opportunit{activeEvents.length === 1 ? 'y' : 'ies'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {activeEvents.map((evt) => (
                    <EventCard key={evt._id || evt.id} event={evt} />
                  ))}
                </div>
              </div>
            )}

            {/* Platform Reputation & Reviews */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-navy-950">
                PITCH Verified Track Record
              </h3>
              <ReputationSummary
                reviews={reviews}
                verifiedDeals={verifiedHistory}
                stats={committee.stats}
              />
            </div>

            {/* Self-Reported Offline Fest History */}
            <Card className="p-6 rounded-2xl border border-surface-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-navy-950">
                    Historical Fests & Campus Track Record
                  </h3>
                  <SelfReportedBadge />
                </div>
              </div>

              <p className="text-xs text-surface-500 leading-relaxed">
                The fest editions listed below represent self-reported records organized prior to or outside of PITCH. Per platform governance rules, self-reported history is unverified by PITCH and does not count toward official platform reputation scores.
              </p>

              {history.length === 0 ? (
                <div className="text-center py-6 text-xs text-surface-400 italic">
                  No historical fest records self-reported by this committee.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {history.map((item, idx) => (
                    <div
                      key={item._id || item.id || idx}
                      className="p-4 rounded-xl border border-surface-200 bg-surface-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-navy-950">
                            {item.eventName || 'Campus Fest'}
                          </h4>
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Self-Reported
                          </span>
                        </div>
                        <p className="text-xs text-surface-600 mt-1">
                          {item.year && `Edition: ${item.year}`}
                          {item.footfall && ` • Footfall: ${Number(item.footfall).toLocaleString()}`}
                          {item.sponsorName && ` • Past Sponsor: ${item.sponsorName}`}
                        </p>
                        {item.description && (
                          <p className="text-xs text-surface-500 mt-1.5 italic">
                            "{item.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Campus Affiliation Card */}
            <Card className="p-6 rounded-2xl border border-surface-200">
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">
                College Affiliation
              </h3>

              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-navy-950 text-sm">
                    {collegeName}
                  </h4>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {locationText}
                  </p>
                </div>
              </div>

              <div className="text-xs text-surface-600 pt-3 border-t border-surface-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-surface-500">Committee Type:</span>
                  <span className="font-semibold text-navy-950">{committee.committeeType || 'Student Body'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-500">Campus Status:</span>
                  <span className="font-semibold text-emerald-600">Active Organizer</span>
                </div>
              </div>
            </Card>

            {/* Brand Outreach CTA Card */}
            <Card className="p-6 rounded-2xl border border-surface-200 bg-gradient-to-br from-white to-surface-50">
              <h3 className="font-bold text-navy-950 text-base mb-2">
                Sponsor {committee.name}
              </h3>
              <p className="text-xs text-surface-600 mb-5 leading-relaxed">
                Connect with the organizing student leadership to partner on upcoming campus events, competitions, and college festivals.
              </p>

              {isAuthenticated && user?.role === 'COMPANY' ? (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate('/events')}
                  >
                    Browse Active Events
                  </Button>
                  <p className="text-[11px] text-surface-500 text-center">
                    Apply directly to this committee's published events to initiate talks.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate('/login?role=COMPANY')}
                  >
                    Sign In as Company
                  </Button>
                  <p className="text-[11px] text-surface-500 text-center">
                    Are you a brand?{' '}
                    <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                      Create Company Account
                    </Link>
                  </p>
                </div>
              )}
            </Card>

            {/* Platform Credibility & Boundary Note */}
            <Card className="p-5 rounded-2xl border border-surface-200 bg-surface-50/70">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div className="text-xs text-surface-600 leading-relaxed">
                  <span className="font-semibold text-navy-950 block mb-1">
                    Platform Credibility Notice
                  </span>
                  PITCH facilitates transparent campus partnerships. Platform deals are backed by mutual MoU agreement generation and post-event reviews. External historical entries are strictly labeled as self-reported.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommitteeDetails;
