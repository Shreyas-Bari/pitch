import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Mail,
  ExternalLink,
  Target,
  Sparkles,
  Award,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { companyService } from '../../services/companyService';
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

export function CompanyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [company, setCompany] = useState(null);
  const [history, setHistory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [verifiedHistory, setVerifiedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCompanyData() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch company profile
        const res = await companyService.getCompany(id);
        const companyData = res?.data?.company || res?.data;

        if (!companyData && isMounted) {
          setError('Company profile not found.');
          return;
        }

        if (isMounted) setCompany(companyData);

        // Concurrently fetch self-reported history, reviews, and verified history
        const [historyRes, reviewsRes, verifiedRes] = await Promise.allSettled([
          companyService.getCompanyHistory(id),
          companyService.getCompanyReviews(id),
          companyService.getCompanyVerifiedHistory(id),
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
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err?.response?.status === 404
              ? 'This company could not be found.'
              : err?.response?.data?.error?.message || err.message || 'Failed to load company profile.';
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCompanyData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return <PageLoading message="Loading company profile..." />;
  }

  if (error || !company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Company Not Found"
          message={error || 'The requested company could not be found.'}
          action={
            <Button variant="primary" onClick={() => navigate('/companies')}>
              Back to Companies Directory
            </Button>
          }
        />
      </div>
    );
  }

  const logoUrl = getAvatarImageUrl(company);
  const locationText = company.location?.city
    ? `${company.location.city}${company.location.state ? `, ${company.location.state}` : ''}`
    : 'India';

  const preferences = company.sponsorshipPreferences || {};
  const categories = preferences.eventCategories || [];
  const contributionTypes = preferences.contributionTypes || [];
  const targetAudience = company.targetAudience || preferences.targetDemographics || [];

  return (
    <div className="min-w-0 pb-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Link
          to="/companies"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-600 hover:text-navy-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Companies Directory</span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Profile Hero Card */}
        <Card className="p-6 sm:p-8 rounded-3xl border border-surface-200 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar
              name={company.name}
              src={logoUrl}
              size="xl"
              className="rounded-2xl border-2 border-surface-200 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
                    {company.name}
                  </h1>
                  <p className="text-sm font-semibold text-primary-600 mt-0.5">
                    {company.industry || 'Corporate Sponsor'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Registered Brand
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500 mt-3 pt-3 border-t border-surface-100">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-surface-400" />
                  <span>{locationText}</span>
                </span>
                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
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
                About the Company
              </h2>
              <div className="prose prose-slate max-w-none text-surface-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {company.description ||
                  'This company has not provided a public summary yet. They are registered on the PITCH marketplace for collegiate event sponsorships.'}
              </div>
            </Card>

            {/* Sponsorship Preferences */}
            <Card className="p-6 rounded-2xl border border-surface-200 space-y-6">
              <h3 className="text-lg font-bold text-navy-950">
                Sponsorship Interests & Preferences
              </h3>

              {categories.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2.5">
                    Target Event Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {contributionTypes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2.5">
                    Accepted Contribution Formats
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {contributionTypes.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-surface-100 text-surface-800 border border-surface-300 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{type}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {targetAudience.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2.5">
                    Target Campus Demographics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {targetAudience.map((aud) => (
                      <span
                        key={aud}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-surface-50 text-surface-600 border border-surface-200"
                      >
                        {aud}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Platform Reputation & Reviews */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-navy-950">
                PITCH Verified Track Record
              </h3>
              <ReputationSummary
                reviews={reviews}
                verifiedDeals={verifiedHistory}
                stats={company.stats}
              />
            </div>

            {/* Self-Reported External History */}
            <Card className="p-6 rounded-2xl border border-surface-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-navy-950">
                    External Sponsorship Portfolio
                  </h3>
                  <SelfReportedBadge />
                </div>
              </div>

              <p className="text-xs text-surface-500 leading-relaxed">
                The sponsorships below are self-reported by the brand from historical activity before or outside PITCH. Per platform governance rules, self-reported records are not verified by PITCH and do not count toward official platform reputation scores.
              </p>

              {history.length === 0 ? (
                <div className="text-center py-6 text-xs text-surface-400 italic">
                  No external sponsorships self-reported by this organization.
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
                            {item.eventName || 'Festival Sponsorship'}
                          </h4>
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Self-Reported
                          </span>
                        </div>
                        <p className="text-xs text-surface-600 mt-1">
                          {item.collegeName || item.committeeName || 'Campus Partner'}
                          {item.year && ` • ${item.year}`}
                        </p>
                        {item.description && (
                          <p className="text-xs text-surface-500 mt-1.5 italic">
                            "{item.description}"
                          </p>
                        )}
                      </div>
                      {item.contributionType && (
                        <div className="text-xs font-semibold text-surface-700 bg-white px-2.5 py-1 rounded-lg border border-surface-200 self-start sm:self-auto">
                          {item.contributionType}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Outreach CTA Card */}
            <Card className="p-6 rounded-2xl border border-surface-200 bg-gradient-to-br from-white to-surface-50">
              <h3 className="font-bold text-navy-950 text-base mb-2">
                Connect with {company.name}
              </h3>
              <p className="text-xs text-surface-600 mb-5 leading-relaxed">
                Student committees can publish campus festivals to attract applications or invite registered brands to explore sponsorship packages.
              </p>

              {isAuthenticated && user?.role === 'COMMITTEE' ? (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate('/events')}
                  >
                    View Active Marketplace
                  </Button>
                  <p className="text-[11px] text-surface-500 text-center">
                    Publish your event in the Committee Portal to receive sponsorship proposals.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => navigate('/login?role=COMMITTEE')}
                  >
                    Sign In as Committee
                  </Button>
                  <p className="text-[11px] text-surface-500 text-center">
                    Looking for sponsors?{' '}
                    <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                      Join as a Student Committee
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

export default CompanyDetails;
