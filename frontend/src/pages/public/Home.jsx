import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants';
import { getDashboardPath } from '../../utils/permissions';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EventCard from '../../components/events/EventCard';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  Compass,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Handshake,
  CheckCircle,
  FileText,
  TrendingUp,
  Search,
  MessageSquare,
  Award,
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  { step: '01', title: 'Discover', desc: 'Browse curated campus fests & brand sponsors.' },
  { step: '02', title: 'Connect', desc: 'Submit sponsorship applications or invites.' },
  { step: '03', title: 'Negotiate', desc: 'Propose cash or in-kind deliverables directly.' },
  { step: '04', title: 'MoU Closing', desc: 'PITCH_MOU_V1 snapshot with SHA-256 hash.' },
  { step: '05', title: 'Fulfill', desc: 'Upload proof & verify deliverables received.' },
  { step: '06', title: 'Reputation', desc: 'Earn verified reviews on closed deals.' },
];

export function Home() {
  const { isAuthenticated, user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadFeatured() {
      try {
        setLoadingEvents(true);
        const res = await eventService.getEvents({ limit: 3, sort: 'eventDate', order: 'asc' });
        const eventsList = res.data?.events || res.data || [];
        if (mounted) {
          setFeaturedEvents(Array.isArray(eventsList) ? eventsList.slice(0, 3) : []);
        }
      } catch {
        if (mounted) setFeaturedEvents([]);
      } finally {
        if (mounted) setLoadingEvents(false);
      }
    }
    loadFeatured();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-24 pb-24">
      {/* ================= Hero Section ================= */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 bg-gradient-to-b from-white via-slate-50/60 to-pitch-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Stage Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-pitch-blue text-xs font-semibold mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Collegiate Sponsorship Marketplace</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-pitch-navy font-display tracking-tight max-w-5xl mx-auto leading-[1.1]">
            Where Brands Meet <span className="text-pitch-blue">Campus Communities</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-pitch-muted max-w-3xl mx-auto leading-relaxed">
            PITCH connects top brand sponsors with verified college committees across India.
            Discover high-impact festivals, negotiate structured deliverables, close tamper-evident MoUs,
            and track fulfillment seamlessly.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/events">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Compass className="w-5 h-5" />}
                className="shadow-md text-base px-6 py-3 font-semibold"
              >
                Explore Campus Events
              </Button>
            </Link>

            {isAuthenticated ? (
              <Link to={getDashboardPath(user?.role)}>
                <Button variant="outline" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Go to {user?.role} Portal
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/register">
                  <Button variant="outline" size="lg" className="border-slate-300">
                    Join as Brand or College
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Key Value Pill Indicators */}
          <div className="mt-14 pt-8 border-t border-slate-200/60 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3">
              <span className="text-xl sm:text-2xl font-bold font-display text-pitch-navy block">Direct</span>
              <span className="text-xs text-pitch-muted">Brand-Campus Matching</span>
            </div>
            <div className="p-3">
              <span className="text-xl sm:text-2xl font-bold font-display text-pitch-navy block">11 Formats</span>
              <span className="text-xs text-pitch-muted">Cash & In-Kind Support</span>
            </div>
            <div className="p-3">
              <span className="text-xl sm:text-2xl font-bold font-display text-pitch-navy block">SHA-256</span>
              <span className="text-xs text-pitch-muted">Tamper-Evident MoUs</span>
            </div>
            <div className="p-3">
              <span className="text-xl sm:text-2xl font-bold font-display text-pitch-navy block">Closed-Loop</span>
              <span className="text-xs text-pitch-muted">Platform Reputation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Featured Events Section ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-pitch-blue uppercase tracking-wider mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Active Marketplace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-pitch-navy">
              Upcoming Campus Festivals & Sponsorships
            </h2>
            <p className="text-sm text-pitch-muted mt-1">
              Live sponsorship opportunities published directly by verified college organizing committees.
            </p>
          </div>

          <Link to="/events">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Events
            </Button>
          </Link>
        </div>

        {loadingEvents ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event._id || event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <Compass className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-display font-bold text-base text-pitch-navy">
              No Published Events Yet
            </h3>
            <p className="text-xs text-pitch-muted max-w-md mx-auto mt-1 mb-5">
              Organizing committees are currently drafting fest packages for the upcoming semester.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register Your Committee
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ================= Two-Sided Value Pillars ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-pitch-navy">
            Built for Both Sides of Collegiate Sponsorship
          </h2>
          <p className="text-sm text-pitch-muted mt-2">
            Eliminating fragmented WhatsApp negotiations and unverified proposals with a modern structured workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Brands */}
          <Card className="p-8 border-slate-200 bg-gradient-to-br from-white to-blue-50/30">
            <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-pitch-blue flex items-center justify-center mb-6">
              <Building2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-display text-pitch-navy mb-3">
              For Brand Sponsors & Corporate Partners
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Connect directly with verified student leadership. Target technical hackathons, cultural festivals,
              and business conclaves with tailored contributions.
            </p>

            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-pitch-blue mt-0.5 flex-shrink-0" />
                <span><strong>Authentic Audience Reach:</strong> Access verified footfall metrics and student demographics.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-pitch-blue mt-0.5 flex-shrink-0" />
                <span><strong>Flexible Contributions:</strong> Support fests via cash, product kits, food, beverages, equipment, or gift hampers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-pitch-blue mt-0.5 flex-shrink-0" />
                <span><strong>Accountable Fulfillment:</strong> Review submitted photo and link evidence before deal completion.</span>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <Link to="/events">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Browse Campus Opportunities
                </Button>
              </Link>
            </div>
          </Card>

          {/* For College Committees */}
          <Card className="p-8 border-slate-200 bg-gradient-to-br from-white to-purple-50/30">
            <div className="w-12 h-12 rounded-2xl bg-purple-100/70 text-purple-700 flex items-center justify-center mb-6">
              <GraduationCap className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-display text-pitch-navy mb-3">
              For College Student Committees & Clubs
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Present your campus festivals with institutional credibility. Publish customizable sponsorship packages,
              manage inquiries in one central inbox, and close deals safely.
            </p>

            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>Professional Showcase:</strong> Replace unreadable PDF decks with rich, shareable festival profiles.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>Structured Counter-Proposals:</strong> Negotiate deliverable deliverables transparently without version chaos.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>Institutional Reputation:</strong> Build permanent track records on PITCH to attract recurring annual sponsors.</span>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <Link to="/register">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Register Your Committee
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* ================= Lifecycle Journey ================= */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-pitch-blue uppercase tracking-wider block mb-1">
              End-to-End Governance
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-pitch-navy">
              The PITCH Deal Lifecycle
            </h2>
            <p className="text-sm text-pitch-muted mt-2">
              From first discovery to final reciprocal review, every step is governed with clear milestone tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {LIFECYCLE_STEPS.map((item) => (
              <div
                key={item.step}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-extrabold text-pitch-blue font-mono block mb-2">
                    {item.step}
                  </span>
                  <h4 className="font-display font-bold text-sm text-pitch-navy mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/how-it-works" className="text-xs font-bold text-pitch-blue hover:underline inline-flex items-center gap-1">
              <span>Read detailed lifecycle documentation & platform rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= Trust & Platform Principles ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Transparency & Institutional Trust
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-pitch-navy">
                PITCH Governance Principles
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-pitch-muted max-w-md">
              PITCH is designed as an accountability and negotiation layer, upholding clear boundaries for legal and financial safety.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm leading-relaxed">
            <div className="space-y-2">
              <h4 className="font-bold text-pitch-navy flex items-center gap-2">
                <Handshake className="w-4 h-4 text-pitch-blue" />
                Direct Financial Settlement
              </h4>
              <p className="text-slate-600">
                PITCH does not process payments or hold funds in escrow. All monetary or in-kind exchanges happen directly
                between the sponsor and the campus committee. PITCH records milestones and fulfillment evidence.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-pitch-navy flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-pitch-blue" />
                PITCH_MOU_V1 Architecture
              </h4>
              <p className="text-slate-600">
                Agreed terms automatically generate a tamper-evident MoU snapshot sealed with a SHA-256 cryptographic hash.
                Digital signing serves an academic demo governance workflow.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-pitch-navy flex items-center gap-2">
                <Award className="w-4 h-4 text-pitch-blue" />
                Verified Closed-Loop Reputation
              </h4>
              <p className="text-slate-600">
                PITCH platform reputation is earned strictly from successfully completed deals. Older offline sponsorships
                are clearly designated as <strong>SELF-REPORTED</strong> and do not artificially inflate platform scores.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
