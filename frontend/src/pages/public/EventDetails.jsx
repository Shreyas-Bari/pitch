import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Target,
  Sparkles,
  Building2,
  ExternalLink,
  ShieldCheck,
  Send,
  DollarSign,
  Gift,
  Share2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { packageService } from '../../services/packageService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import EventHero from '../../components/events/EventHero';
import SponsorshipPackageCard from '../../components/events/SponsorshipPackageCard';
import ApplicationModal from '../../components/events/ApplicationModal';
import EventGallery from '../../components/events/EventGallery';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';
import Avatar from '../../components/ui/Avatar';

export function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEventData() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch event details
        const eventRes = await eventService.getEvent(id);
        const eventData = eventRes?.data?.event || eventRes?.data;

        if (!eventData && isMounted) {
          setError('Event not found or has been removed.');
          return;
        }

        if (isMounted) {
          setEvent(eventData);
        }

        // Fetch packages for this event
        try {
          const pkgRes = await packageService.getPackagesByEvent(id);
          const pkgList = Array.isArray(pkgRes?.data?.packages)
            ? pkgRes.data.packages
            : (Array.isArray(pkgRes?.data)
              ? pkgRes.data
              : (Array.isArray(pkgRes?.packages) ? pkgRes.packages : []));
          if (isMounted) setPackages(pkgList);
        } catch (pkgErr) {
          // If packages fail or none exist, keep packages empty
          if (isMounted) setPackages([]);
        }

        // Check if saved by current company user
        if (isAuthenticated && user?.role === 'COMPANY') {
          try {
            const savedRes = await eventService.getSavedEvents();
            if (isMounted && savedRes?.data) {
              const savedIds = (savedRes.data || []).map((e) =>
                typeof e === 'string' ? e : e._id || e.id
              );
              setIsSaved(savedIds.includes(id));
            }
          } catch {
            // Ignore saved events error
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err?.response?.status === 404
              ? 'This event could not be found.'
              : err?.response?.data?.error?.message || err.message || 'Failed to load event details.';
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEventData();

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated, user]);

  const handleSaveToggle = async () => {
    if (!isAuthenticated || user?.role !== 'COMPANY') {
      toast.info('Please sign in as a Company to save events.');
      return;
    }

    try {
      setSaving(true);
      if (isSaved) {
        await eventService.unsaveEvent(id);
        setIsSaved(false);
        toast.success('Removed from saved events');
      } else {
        await eventService.saveEvent(id);
        setIsSaved(true);
        toast.success('Event saved to your pipeline');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update saved event');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenApplyModal = (pkg = null) => {
    if (!isAuthenticated) {
      toast.info('Please sign in as a Company to apply for sponsorships.');
      navigate('/login?role=COMPANY');
      return;
    }

    if (user?.role !== 'COMPANY') {
      toast.warning('Only verified brand/company accounts can apply for sponsorships.');
      return;
    }

    setSelectedPackage(pkg);
    setIsApplyModalOpen(true);
  };

  if (loading) {
    return <PageLoading message="Loading event details..." />;
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Event Not Available"
          message={error || 'The requested event is not available.'}
          action={
            <Button variant="primary" onClick={() => navigate('/events')}>
              Back to Events Discovery
            </Button>
          }
        />
      </div>
    );
  }

  const committee = event.committeeId || {};
  const committeeId = committee._id || committee.id;
  const isOrganizer = isAuthenticated && user?.role === 'COMMITTEE' && user?.committeeId === committeeId;
  const isCompany = isAuthenticated && user?.role === 'COMPANY';

  const audienceMin = event.expectedAudience?.min;
  const audienceMax = event.expectedAudience?.max;
  const estimatedReach = event.estimatedReach;
  const budgetMin = event.sponsorshipRequirements?.budgetMin;
  const budgetMax = event.sponsorshipRequirements?.budgetMax;
  const contributionTypes = event.sponsorshipRequirements?.contributionTypes || [];
  const galleryMedia = event.media || event.gallery || [];

  return (
    <div className="min-w-0 pb-20">
      {/* Breadcrumb / Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-600 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events Marketplace</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Hero Section */}
        <EventHero
          event={event}
          onApplyClick={() => handleOpenApplyModal(null)}
          onSaveClick={handleSaveToggle}
          isSaved={isSaved}
          saving={saving}
          userRole={user?.role}
          isOrganizer={isOrganizer}
        />

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Overview / Description */}
            <Card className="p-6 sm:p-8 rounded-2xl border border-surface-200">
              <h2 className="text-xl font-bold text-navy-950 mb-4 flex items-center gap-2">
                <span>About the Event</span>
              </h2>
              <div className="prose prose-slate max-w-none text-surface-700 leading-relaxed whitespace-pre-line text-base">
                {event.description || 'No detailed description provided by the organizing committee.'}
              </div>

              {/* Key Highlights / Metrics */}
              <div className="mt-8 pt-6 border-t border-surface-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
                    <Users className="w-3.5 h-3.5 text-primary-600" />
                    <span>Audience</span>
                  </div>
                  <div className="text-base font-bold text-navy-950">
                    {audienceMax
                      ? `${audienceMin ? `${audienceMin.toLocaleString()} - ` : ''}${audienceMax.toLocaleString()}`
                      : estimatedReach
                      ? `${estimatedReach.toLocaleString()} Expected`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-surface-500 mt-0.5">Footfall on campus</div>
                </div>

                <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
                    <Target className="w-3.5 h-3.5 text-primary-600" />
                    <span>Format</span>
                  </div>
                  <div className="text-base font-bold text-navy-950">
                    {event.location?.mode || 'PHYSICAL'}
                  </div>
                  <div className="text-xs text-surface-500 mt-0.5">{event.category || 'Festival'}</div>
                </div>

                <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
                    <Calendar className="w-3.5 h-3.5 text-primary-600" />
                    <span>Event Date</span>
                  </div>
                  <div className="text-base font-bold text-navy-950">
                    {formatDate(event.eventDate || event.startDate)}
                  </div>
                  <div className="text-xs text-surface-500 mt-0.5">
                    {event.endDate ? `Until ${formatDate(event.endDate)}` : 'Single day'}
                  </div>
                </div>

                <div className="bg-surface-50 p-3.5 rounded-xl border border-surface-200/80">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-primary-600" />
                    <span>Target Range</span>
                  </div>
                  <div className="text-base font-bold text-navy-950">
                    {budgetMax
                      ? `${budgetMin ? `${formatCurrency(budgetMin)} - ` : ''}${formatCurrency(budgetMax)}`
                      : 'Flexible'}
                  </div>
                  <div className="text-xs text-surface-500 mt-0.5">Sponsorship pool</div>
                </div>
              </div>
            </Card>

            {/* Sponsorship Requirements / Contribution Types */}
            {contributionTypes.length > 0 && (
              <Card className="p-6 rounded-2xl border border-surface-200">
                <h3 className="text-lg font-bold text-navy-950 mb-3">
                  Accepted Contribution Types
                </h3>
                <p className="text-sm text-surface-600 mb-4">
                  The committee is open to partnerships across the following contribution formats:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {contributionTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 text-surface-800 text-sm font-semibold border border-surface-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{type}</span>
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Campus & Fest Gallery */}
            {galleryMedia.length > 0 && (
              <Card className="p-6 rounded-2xl border border-surface-200">
                <EventGallery media={galleryMedia} />
              </Card>
            )}

            {/* Sponsorship Packages Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-navy-950">
                  Sponsorship Packages & Tiers
                </h2>
                <p className="text-sm text-surface-600 mt-1">
                  Select a predefined sponsorship tier or submit a customized proposal tailored to your brand goals.
                </p>
              </div>

              {/* Disclaimer Notice Banner */}
              <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Informational Tier Notice:</span> Packages represent starting proposal templates and expected deliverable tiers specified by the student committee. They are not final binding agreements. All specific deliverable requirements and contributions are finalized via mutual negotiation and MoU execution.
                </div>
              </div>

              {/* Package Cards List */}
              {packages.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-surface-300 bg-surface-50">
                  <Sparkles className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                  <h4 className="text-base font-semibold text-navy-950">Custom Proposal Opportunity</h4>
                  <p className="text-sm text-surface-600 max-w-md mx-auto mt-1 mb-5">
                    This committee has not published fixed package tiers yet. You can apply with a custom sponsorship proposal.
                  </p>
                  {isCompany && (
                    <Button variant="primary" onClick={() => handleOpenApplyModal(null)}>
                      Submit Custom Proposal
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {packages.map((pkg) => (
                    <div key={pkg._id || pkg.id} className="flex flex-col">
                      <SponsorshipPackageCard
                        pkg={pkg}
                        isSelected={selectedPackage?._id === pkg._id}
                        onSelect={() => handleOpenApplyModal(pkg)}
                      />
                      {isCompany && (
                        <div className="mt-3">
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={() => handleOpenApplyModal(pkg)}
                          >
                            Apply for {pkg.title}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Committee Organizer Card */}
            <Card className="p-6 rounded-2xl border border-surface-200">
              <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">
                Organized By
              </h3>

              <div className="flex items-start gap-3.5 mb-4">
                <Avatar
                  name={committee.name || 'Committee'}
                  src={committee.logoUrl}
                  size="lg"
                  variant="committee"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-navy-950 text-base leading-snug">
                    {committee.name || 'Student Committee'}
                  </h4>
                  <p className="text-xs text-surface-600 mt-0.5 truncate">
                    {committee.college?.name || event.collegeName || 'Campus Community'}
                  </p>
                  <p className="text-xs text-surface-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-surface-400" />
                    <span>
                      {committee.college?.location?.city || event.location?.city || 'India'}
                    </span>
                  </p>
                </div>
              </div>

              {committee.description && (
                <p className="text-xs text-surface-600 line-clamp-3 mb-4">
                  {committee.description}
                </p>
              )}

              {committeeId && (
                <Link
                  to={`/committees/${committeeId}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors border border-primary-200"
                >
                  <span>View Committee Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </Card>

            {/* Quick Action Box */}
            <Card className="p-6 rounded-2xl border border-surface-200 bg-gradient-to-br from-white to-surface-50">
              <h3 className="font-bold text-navy-950 text-base mb-2">
                Partner with this Fest
              </h3>
              <p className="text-xs text-surface-600 mb-5 leading-relaxed">
                Connect with the organizing student leadership to discuss branding placements, campus activations, and audience reach.
              </p>

              {isCompany ? (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleOpenApplyModal(null)}
                >
                  <Send className="w-4 h-4 mr-2" />
                  <span>Apply for Sponsorship</span>
                </Button>
              ) : isOrganizer ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 text-center">
                  You are the organizer of this event. Manage applications in the Committee Portal.
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
                    New brand?{' '}
                    <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                      Create Company Account
                    </Link>
                  </p>
                </div>
              )}
            </Card>

            {/* Platform Integrity & Safety Card */}
            <Card className="p-5 rounded-2xl border border-surface-200 bg-surface-50/70">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div className="text-xs text-surface-600 leading-relaxed">
                  <span className="font-semibold text-navy-950 block mb-1">
                    PITCH Deal Protocol
                  </span>
                  All collaborations proceed through mutual negotiation, formal MoU generation, and post-fest deliverable reviews. PITCH does not hold escrow or charge payment gateway fees.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Application Dialog */}
      {isApplyModalOpen && (
        <ApplicationModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          event={event}
          packages={packages}
          initialPackage={selectedPackage}
          onSuccess={() => {
            setIsApplyModalOpen(false);
            toast.success('Your sponsorship application has been submitted to the committee!');
          }}
        />
      )}
    </div>
  );
}

export default EventDetails;
