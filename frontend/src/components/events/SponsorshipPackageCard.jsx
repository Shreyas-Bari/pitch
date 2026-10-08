import React from 'react';
import { Check, Sparkles, AlertCircle, Users, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * SponsorshipPackageCard
 * Displays available committee package offerings.
 * Explicitly follows business rule: Packages are initial proposals/offers, NOT final contractual deals.
 */
export function SponsorshipPackageCard({
  pkg,
  onSelect = null,
  isSelected = false,
  className = '',
}) {
  if (!pkg) return null;

  const cashAmount = pkg.cashRequirement?.amount;
  const contributionTypes = pkg.contributionTypes || ['CASH'];
  const benefits = pkg.benefits || [];
  const availability = pkg.availability !== undefined ? pkg.availability : 1;
  const isAvailable = pkg.status !== 'FULL' && pkg.status !== 'INACTIVE' && availability > 0;

  return (
    <Card
      hover={isAvailable}
      className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all ${
        isSelected
          ? 'border-pitch-blue ring-2 ring-pitch-blue/20 bg-blue-50/20 shadow-md'
          : 'border-slate-200/90 bg-white hover:border-slate-300 shadow-sm'
      } ${!isAvailable ? 'opacity-60 bg-slate-50' : ''} ${className}`}
    >
      <div>
        {/* Tier Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 className="font-display font-bold text-lg text-pitch-navy">
              {pkg.title}
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {contributionTypes.map((type) => (
                <span
                  key={type}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-bold font-display text-pitch-navy block">
              {cashAmount > 0 ? formatCurrency(cashAmount) : 'In-Kind / Custom'}
            </span>
            <span className="text-[11px] text-pitch-muted">
              {cashAmount > 0 ? 'Starting tier contribution' : 'Product / In-kind value'}
            </span>
          </div>
        </div>

        {/* Description */}
        {pkg.description && (
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            {pkg.description}
          </p>
        )}

        {/* Benefits Checklist */}
        <div className="space-y-2 mb-6">
          <span className="text-[11px] font-bold text-pitch-muted uppercase tracking-wider block">
            Package Deliverables & Benefits
          </span>
          {benefits.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-slate-700">
              {benefits.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="leading-snug">{typeof b === 'object' ? b.description || b.name : b}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Deliverables discussed during proposal negotiation</p>
          )}
        </div>
      </div>

      {/* Package Disclaimer & Action */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs text-pitch-muted">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {availability > 0 ? `${availability} spot${availability === 1 ? '' : 's'} remaining` : 'Full'}
          </span>
          <span className="text-[11px] text-slate-400 italic">
            Proposal tier (not final MoU)
          </span>
        </div>

        {onSelect && (
          <Button
            variant={isSelected ? 'primary' : 'outline'}
            size="md"
            disabled={!isAvailable}
            onClick={() => onSelect(pkg)}
            className="w-full justify-center"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isSelected ? 'Selected for Proposal' : isAvailable ? 'Apply with this Package' : 'Tier Fully Booked'}
          </Button>
        )}
      </div>
    </Card>
  );
}

export default SponsorshipPackageCard;
