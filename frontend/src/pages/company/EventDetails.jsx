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
import Avatar from '../../components/ui/Avatar';
import PageLoading from '../../components/ui/PageLoading';
import ErrorState from '../../components/ui/ErrorState';

export function CompanyEventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

        const eventRes = await eventService.getEvent(id);
        const eventData = eventRes?.data?.event || eventRes?.data;

        if (!eventData && isMounted) {
          setError('Event not found or has been removed.');
          return;
        }

        if (isMounted) setEvent(eventData);

        try {
          const pkgRes = await packageService.getPackagesByEvent(id);
          const pkgList = Array.isArray(pkgRes?.data) ? pkgRes.data : [];
          if (isMounted) setPackages(pkgList);
        } catch {
          if (isMounted) setPackages([]);
        }

        try {
          const savedRes = await eventService.getSavedEvents();
          if (isMounted && savedRes?.data) {
            const savedIds = (savedRes.data || []).map((e) =>
              typeof e === 'string' ? e : e._id || e.id
            );
            setIsSaved(savedIds.includes(id));
          }
        } catch {}
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.status === 404
              ? 'This event could not be found.'
              : err?.response?.data?.error?.message || err.message || 'Failed to load event details.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEventData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSaveToggle = async () => {
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
    setSelectedPackage(pkg);
    setIsApplyModalOpen(true);
  };

  if (loading) {
    return <PageLoading message="Loading event details..." />;
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Event Not Available"
          message={error || 'The requested event is not available.'}
          action={
            <Button variant="primary" onClick={() => navigate('/company/events')}>
              Back to Events Discovery
            </Button>
          }
        />
      </div>
    );
  }

  const committee = event.committeeId || {};
  const committeeId = committee._id || committee.id;
  const audienceMin = event.expectedAudience?.min;
  const audienceMax = event.expectedAudience?.max;
  const estimatedReach = event.estimatedReach;
  const budgetMin = event.sponsorshipRequirements?.budgetMin;
  const budgetMax = event.sponsorshipRequirements?.budgetMax;
  const contributionTypes = event.sponsorshipRequirements?.contributionTypes || [];
  const galleryMedia = event.media || event.gallery || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          to="/company/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-pitch-muted hover:text-pitch-navy transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Event Discovery</span>
        </Link>
      </div>

      {/* Hero Banner */}
      <EventHero
        event={event}
        onApplyClick={() => handleOpenApplyModal(null)}
        onSaveClick={handleSaveToggle}
        isSaved={isSaved}
        saving={saving}
        userRole="COMPANY"
        isOrganizer={false}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Overview */}
          <Card className="p-6 sm:p-8 border-slate-200">
            <h2 className="text-lg font-bold font-display text-pitch-navy mb-3">
              About the Event
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm">
              {event.description || 'No detailed description provided by the organizing committee.'}
            </div>

            {/* Metrics Chips */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-pitch-muted mb-1">
                  <Users className="w-3.5 h-3.5 text-pitch-blue" />
                  <span>Audience</span>
                </div>
                <div className="text-sm font-bold text-pitch-navy">
                  {audienceMax
                    ? `${audienceMin ? `${audienceMin.toLocaleString()} - ` : ''}${audienceMax.toLocaleString()}`
                    : estimatedReach
                    ? `${estimatedReach.toLocaleString()} Reach`
                    : 'Campus Wide'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-pitch-muted mb-1">
                  <Target className="w-3.5 h-3.5 text-pitch-blue" />
                  <span>Mode</span>
                </div>
                <div className="text-sm font-bold text-pitch-navy">
                  {event.location?.mode || 'PHYSICAL'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-pitch-muted mb-1">
                  <Calendar className="w-3.5 h-3.5 text-pitch-blue" />
                  <span>Date</span>
                </div>
                <div className="text-sm font-bold text-pitch-navy">
                  {formatDate(event.eventDate || event.startDate)}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-pitch-muted mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-pitch-blue" />
                  <span>Target Range</span>
                </div>
                <div className="text-sm font-bold text-pitch-navy">
                  {budgetMax
                    ? `${budgetMin ? `${formatCurrency(budgetMin)} - ` : ''}${formatCurrency(budgetMax)}`
                    : 'Flexible'}
                </div>
              </div>
            </div>
          </Card>

          {/* Contribution Types */}
          {contributionTypes.length > 0 && (
            <Card className="p-6 border-slate-200">
              <h3 className="text-base font-bold text-pitch-navy mb-2">
                Accepted Contribution Types
              </h3>
              <p className="text-xs text-pitch-muted mb-3">
                The organizing committee welcomes partnerships across the following contribution formats:
              </p>
              <div className="flex flex-wrap gap-2">
                {contributionTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{type}</span>
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Fest Media Gallery */}
          {galleryMedia.length > 0 && (
            <Card className="p-6 border-slate-200">
              <EventGallery media={galleryMedia} />
            </Card>
          )}

          {/* Sponsorship Packages Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-display text-pitch-navy">
                Sponsorship Package Tiers
              </h2>
              <p className="text-xs text-pitch-muted mt-1">
                Select an established sponsorship tier to pitch your brand, or submit an open custom proposal.
              </p>
            </div>

            {/* Informational Tier Notice */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Starting Proposal Notice:</span> Package tiers represent initial deliverable guidelines defined by the committee. Deliverables and sponsorship amounts are finalized during Stage 5 MoU negotiation.
              </div>
            </div>

            {packages.length === 0 ? (
              <Card className="text-center py-8 border-dashed border-slate-300">
                <Sparkles className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-pitch-navy">Custom Proposal Opportunity</h4>
                <p className="text-xs text-pitch-muted max-w-sm mx-auto mt-1 mb-4">
                  No predefined tiers published. You can submit a customized sponsorship proposal directly to the organizers.
                </p>
                <Button variant="primary" size="sm" onClick={() => handleOpenApplyModal(null)}>
                  Submit Custom Proposal
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((pkg) => (
                  <div key={pkg._id || pkg.id} className="flex flex-col">
                    <SponsorshipPackageCard
                      pkg={pkg}
                      isSelected={selectedPackage?._id === pkg._id}
                      onSelect={() => handleOpenApplyModal(pkg)}
                    />
                    <div className="mt-3">
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => handleOpenApplyModal(pkg)}
                      >
                        Apply for {pkg.title}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Organizing Committee Card */}
          <Card className="p-6 border-slate-200">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-pitch-muted mb-3">
              Organized By
            </h3>
            <div className="flex items-start gap-3 mb-3">
              <Avatar
                name={committee.name || 'Committee'}
                src={committee.logoUrl}
                size="md"
                variant="committee"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-pitch-navy text-sm truncate">
                  {committee.name || 'Student Committee'}
                </h4>
                <p className="text-xs text-pitch-muted truncate">
                  {committee.college?.name || event.collegeName || 'Campus'}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{committee.college?.location?.city || event.location?.city || 'India'}</span>
                </p>
              </div>
            </div>

            {committeeId && (
              <Link
                to={`/committees/${committeeId}`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-pitch-blue bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <span>View Public Profile</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </Card>

          {/* Quick Apply CTA */}
          <Card className="p-6 border-slate-200 bg-gradient-to-br from-white to-slate-50">
            <h3 className="font-bold text-pitch-navy text-base mb-2">
              Apply for Sponsorship
            </h3>
            <p className="text-xs text-pitch-muted mb-4 leading-relaxed">
              Submit your formal brand application. Once the committee accepts, you can negotiate deliverables and generate an MoU.
            </p>
            <Button
              variant="primary"
              className="w-full"
              leftIcon={<Send className="w-4 h-4" />}
              onClick={() => handleOpenApplyModal(null)}
            >
              Apply to Event
            </Button>
          </Card>

          {/* Deal Protocol */}
          <Card className="p-5 border-slate-200 bg-slate-50">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-pitch-blue shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-pitch-navy block mb-1">
                  PITCH Deal Protocol
                </span>
                Application submission initiates mutual interest. No monetary commitment is locked until mutual MoU agreement and fulfillment.
              </div>
            </div>
          </Card>
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
            toast.success('Your sponsorship application has been submitted!');
            navigate('/company/applications');
          }}
        />
      )}
    </div>
  );
}

export default CompanyEventDetails;
