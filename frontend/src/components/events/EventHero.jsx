import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Building2, Bookmark, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { getEventImageUrl } from '../../utils/imageUtils';
import Button from '../ui/Button';

export function EventHero({
  event,
  onApplyClick,
  onSaveClick,
  isSaved = false,
  saving = false,
  userRole = null,
  isOrganizer = false,
  hasApplied = false,
  applicationStatus = null,
}) {
  if (!event) return null;

  const imageUrl = getEventImageUrl(event);
  const committee = event.committeeId || {};
  const committeeId = committee._id || committee.id;
  const collegeName = committee.college?.name || event.collegeName || 'Campus';
  const committeeName = committee.name || event.committeeName || 'Student Committee';
  const locationCity = event.location?.city || committee.college?.location?.city || 'India';
  const venue = event.location?.venue || 'Campus Grounds';
  const locationMode = event.location?.mode || 'PHYSICAL';
  const audienceMax = event.expectedAudience?.max || event.expectedAudience?.min || event.estimatedReach;
  const budgetMax = event.sponsorshipRequirements?.budgetMax;

  return (
    <div className="relative rounded-3xl overflow-hidden bg-pitch-navy text-white shadow-lg border border-slate-800">
      {/* Background Image with Dark Vignette */}
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover opacity-35 filter blur-[1px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-navy via-pitch-navy/70 to-pitch-navy/40" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[380px] gap-8">
        {/* Top Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/30 text-white">
              {event.category || 'Festival'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/80 text-white backdrop-blur-md">
              {locationMode}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified Fest Opportunity
            </span>
          </div>

          {/* Save Action for Company */}
          {userRole === 'COMPANY' && (
            <button
              type="button"
              onClick={onSaveClick}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
                isSaved
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'Saved in Pipeline' : 'Save Event'}</span>
            </button>
          )}
        </div>

        {/* Middle: Title & Organizing Entity */}
        <div className="space-y-4 max-w-4xl">
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight">
            {event.title}
          </h1>

          {/* Organizer Link */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-200">
            {committeeId ? (
              <Link
                to={`/committees/${committeeId}`}
                className="inline-flex items-center gap-2 font-semibold text-white hover:text-blue-300 transition-colors bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm"
              >
                <Building2 className="w-4 h-4 text-blue-300" />
                <span>{committeeName}</span>
                <span className="text-slate-400">({collegeName})</span>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 font-semibold">
                <Building2 className="w-4 h-4 text-blue-300" />
                <span>{committeeName}</span>
                <span className="text-slate-400">({collegeName})</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Key Metrics & CTAs */}
        <div className="pt-6 border-t border-white/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Key Quick Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 text-xs block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-300" />
                Date
              </span>
              <span className="font-bold text-white mt-0.5 block">
                {formatDate(event.eventDate)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-xs block flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                Location
              </span>
              <span className="font-bold text-white mt-0.5 block">
                {venue}, {locationCity}
              </span>
            </div>

            {audienceMax && (
              <div>
                <span className="text-slate-400 text-xs block flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-300" />
                  Expected Reach
                </span>
                <span className="font-bold text-white mt-0.5 block">
                  {Number(audienceMax).toLocaleString()} attendees
                </span>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {isOrganizer ? (
              <div className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
                Organized by your committee
              </div>
            ) : hasApplied || applicationStatus ? (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                    applicationStatus === 'ACCEPTED'
                      ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                      : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {applicationStatus === 'ACCEPTED'
                      ? 'Application Accepted'
                      : 'Application Pending'}
                  </span>
                </span>
                <Link to="/company/applications">
                  <Button
                    variant="secondary"
                    size="md"
                    className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    View in Pipeline
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={onApplyClick}
                className="w-full md:w-auto bg-pitch-blue hover:bg-blue-600 shadow-md font-semibold"
                leftIcon={<Send className="w-4 h-4" />}
              >
                Apply to Sponsor
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventHero;
