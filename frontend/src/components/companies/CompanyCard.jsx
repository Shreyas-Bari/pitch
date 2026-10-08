import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Target, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { getAvatarImageUrl } from '../../utils/imageUtils';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';

export function CompanyCard({ company, className = '' }) {
  if (!company) return null;

  const companyId = company._id || company.id;
  const logoUrl = getAvatarImageUrl(company);
  const locationText = company.location?.city
    ? `${company.location.city}${company.location.state ? `, ${company.location.state}` : ''}`
    : 'India';

  const preferences = company.sponsorshipPreferences || {};
  const categories = preferences.eventCategories || [];
  const contributionTypes = preferences.contributionTypes || [];

  return (
    <Card
      hover
      className={`group flex flex-col justify-between p-6 rounded-2xl border border-slate-200/80 hover:border-pitch-blue/40 bg-white transition-all shadow-sm hover:shadow-md ${className}`}
    >
      <div>
        {/* Top Header: Logo & Identity */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar
            name={company.name}
            src={logoUrl}
            size="lg"
            className="rounded-2xl border border-slate-200 shadow-sm"
          />

          <div className="min-w-0 flex-1">
            <h3 className="font-display font-bold text-lg text-pitch-navy group-hover:text-pitch-blue transition-colors truncate">
              {company.name}
            </h3>
            <p className="text-xs font-semibold text-pitch-blue mt-0.5 truncate">
              {company.industry || 'Brand Sponsor'}
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{locationText}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
          {company.description || 'Active brand exploring collegiate sponsorship, campus activations, and community engagements.'}
        </p>

        {/* Interests & Categories */}
        {categories.length > 0 && (
          <div className="space-y-1.5 mb-4">
            <span className="text-[11px] font-bold text-pitch-muted uppercase tracking-wider block">
              Sponsorship Interests
            </span>
            <div className="flex flex-wrap gap-1">
              {categories.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-pitch-blue border border-blue-100"
                >
                  {cat}
                </span>
              ))}
              {categories.length > 3 && (
                <span className="text-[11px] text-slate-400 px-1 py-0.5">
                  +{categories.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">
          {contributionTypes.length > 0 ? `${contributionTypes.length} Contribution Formats` : 'Direct Partnership'}
        </span>

        <Link
          to={`/companies/${companyId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-pitch-blue group-hover:text-pitch-navy transition-colors"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  );
}

export default CompanyCard;
