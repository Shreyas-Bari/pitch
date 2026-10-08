import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, MapPin, Calendar, Award, ArrowRight, Building } from 'lucide-react';
import { getAvatarImageUrl } from '../../utils/imageUtils';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';

export function CommitteeCard({ committee, className = '' }) {
  if (!committee) return null;

  const committeeId = committee._id || committee.id;
  const logoUrl = getAvatarImageUrl(committee);
  const college = committee.college || {};
  const collegeName = college.name || 'University Campus';
  const locationText = college.location?.city
    ? `${college.location.city}${college.location.state ? `, ${college.location.state}` : ''}`
    : 'India';

  const stats = committee.stats || {};
  const eventsCount = stats.eventsOrganized || 0;

  return (
    <Card
      hover
      className={`group flex flex-col justify-between p-6 rounded-2xl border border-slate-200/80 hover:border-pitch-blue/40 bg-white transition-all shadow-sm hover:shadow-md ${className}`}
    >
      <div>
        {/* Top Header: Logo & Identity */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            name={committee.name}
            src={logoUrl}
            size="lg"
            className="rounded-2xl border border-slate-200 shadow-sm"
          />

          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-lg text-pitch-navy group-hover:text-pitch-blue transition-colors truncate">
              {committee.name}
            </h3>
            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-pitch-blue flex-shrink-0" />
              <span className="truncate">{collegeName}</span>
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{locationText}</span>
            </div>
          </div>
        </div>

        {/* Committee Type Pill */}
        <div className="mb-3">
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-pitch-blue border border-blue-100">
            {committee.committeeType || 'Student Body'}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
          {committee.description || 'Verified collegiate student committee responsible for curating campus festivals, technical hackathons, and corporate sponsorships.'}
        </p>
      </div>

      {/* Footer Link & Stats */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{eventsCount > 0 ? `${eventsCount} Campus Event${eventsCount === 1 ? '' : 's'}` : 'Organizing Team'}</span>
        </span>

        <Link
          to={`/committees/${committeeId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-pitch-blue group-hover:text-pitch-navy transition-colors"
        >
          <span>View Committee</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  );
}

export default CommitteeCard;
