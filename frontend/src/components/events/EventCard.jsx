import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Bookmark, Building2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { getEventImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { eventService } from '../../services/eventService';
import Card from '../ui/Card';

/**
 * EventCard
 * Visually prioritized marketplace event card combining Instagram-style
 * photography discovery with professional credibility signals.
 */
export function EventCard({
  event,
  isSaved: initialSaved = false,
  onSaveToggle = null,
  className = '',
}) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  if (!event) return null;

  const eventId = event._id || event.id;
  const imageUrl = getEventImageUrl(event);
  const committee = event.committeeId || {};
  const collegeName = committee.college?.name || event.collegeName || 'Campus';
  const committeeName = committee.name || event.committeeName || 'Student Committee';
  const locationCity = event.location?.city || committee.college?.location?.city || 'India';
  const locationMode = event.location?.mode || 'PHYSICAL';

  const audienceMax = event.expectedAudience?.max || event.expectedAudience?.min || event.estimatedReach;
  const budgetMax = event.sponsorshipRequirements?.budgetMax;
  const contributionTypes = event.sponsorshipRequirements?.contributionTypes || [];

  const isCompanyUser = isAuthenticated && user?.role === 'COMPANY';

  const handleSaveClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isCompanyUser) {
      toast.info('Please sign in as a Company to save events for later.');
      return;
    }

    try {
      setSaving(true);
      if (isSaved) {
        await eventService.unsaveEvent(eventId);
        setIsSaved(false);
        toast.success('Removed from saved events');
        if (onSaveToggle) onSaveToggle(eventId, false);
      } else {
        await eventService.saveEvent(eventId);
        setIsSaved(true);
        toast.success('Event saved to your pipeline');
        if (onSaveToggle) onSaveToggle(eventId, true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update saved event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      hover
      className={`group flex flex-col overflow-hidden border border-slate-200/80 hover:border-pitch-blue/40 bg-white rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md ${className}`}
    >
      <Link to={`/events/${eventId}`} className="flex flex-col flex-1">
        {/* Banner Image Container */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <img
            src={imageUrl}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Gradient Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-md text-pitch-navy border border-white/40 shadow-sm">
              {event.category || 'Festival'}
            </span>
            {locationMode !== 'PHYSICAL' && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/90 text-white backdrop-blur-md">
                {locationMode}
              </span>
            )}
          </div>

          {/* Save Action for Companies */}
          {isCompanyUser && (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saving}
              aria-label={isSaved ? 'Unsave event' : 'Save event'}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm z-20 ${
                isSaved
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/90 text-slate-700 hover:bg-white hover:text-pitch-blue'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Audience and Footfall Badge Overlay */}
          {audienceMax && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white/95 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
              <Users className="w-3.5 h-3.5 text-blue-300" />
              <span>{Number(audienceMax).toLocaleString()} expected</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col flex-1 justify-between gap-3">
          <div>
            {/* College & Committee Subtitle */}
            <div className="flex items-center gap-1.5 text-xs text-pitch-muted mb-1 font-medium truncate">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">{collegeName}</span>
              <span className="text-slate-300">•</span>
              <span className="truncate">{committeeName}</span>
            </div>

            {/* Event Title */}
            <h3 className="font-display font-bold text-lg text-pitch-navy group-hover:text-pitch-blue transition-colors line-clamp-1">
              {event.title}
            </h3>

            {/* Description Snippet */}
            <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Metadata Row */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>{formatDate(event.eventDate)}</span>
            </div>

            <div className="flex items-center gap-1 truncate text-slate-600 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{locationCity}</span>
            </div>
          </div>

          {/* Sponsorship Signal Footer */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
                Sponsorship
              </span>
              <span className="font-bold text-pitch-navy text-sm font-display">
                {budgetMax ? `Up to ${formatCurrency(budgetMax, { compact: true })}` : 'Custom Tiers'}
              </span>
            </div>

            {contributionTypes.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {contributionTypes.slice(0, 2).map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700"
                  >
                    {type}
                  </span>
                ))}
                {contributionTypes.length > 2 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    +{contributionTypes.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}

export default EventCard;
