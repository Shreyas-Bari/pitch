import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Building,
  GraduationCap,
  ArrowRight,
  Banknote,
  Package,
} from 'lucide-react';
import DealStatusBadge from './DealStatusBadge';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

export function DealCard({ deal, userRole, basePath = '/deals' }) {
  if (!deal) return null;

  const isCompany = userRole === 'COMPANY';
  const partner = isCompany ? deal.committeeId : deal.companyId;
  const partnerName = partner?.name || (isCompany ? 'Campus Committee' : 'Brand Sponsor');
  const partnerSub = isCompany
    ? partner?.college || 'College Committee'
    : partner?.industry || 'Brand Partner';
  const partnerAvatar = partner?.logo || partner?.logoUrl || null;
  const partnerRole = isCompany ? 'COMMITTEE' : 'COMPANY';

  const event = deal.eventId || {};

  // Contribution summary snippet
  const contributions = deal.contributions || {};
  const cashAmount = contributions.cash?.amount || 0;
  const inKindCount = Array.isArray(contributions.nonCash) ? contributions.nonCash.length : 0;

  const detailPath = `${basePath}/${deal._id}`;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={partnerName} src={partnerAvatar} size="md" role={partnerRole} />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 font-display truncate">
                {partnerName}
              </h4>
              <p className="text-xs text-slate-500 truncate">{partnerSub}</p>
            </div>
          </div>

          <DealStatusBadge status={deal.status} size="sm" />
        </div>

        {/* Event context */}
        {event.title && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 text-xs">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Event Context
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 truncate">{event.title}</span>
              {event.eventDate && (
                <span className="text-[11px] text-slate-500 shrink-0">
                  {formatDate(event.eventDate)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Contributions Snapshot */}
        <div className="space-y-1 text-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Agreed Consideration
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {cashAmount > 0 && (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                <Banknote className="w-3.5 h-3.5" />
                <span>{formatCurrency(cashAmount)}</span>
              </span>
            )}
            {inKindCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-primary-800 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                <Package className="w-3.5 h-3.5" />
                <span>{inKindCount} In-Kind {inKindCount === 1 ? 'item' : 'items'}</span>
              </span>
            )}
            {cashAmount === 0 && inKindCount === 0 && (
              <span className="text-slate-400 italic">Negotiation in progress</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer & CTA */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <span className="text-[11px] text-slate-400">
          Updated {formatDate(deal.updatedAt || deal.createdAt, { format: 'relative' })}
        </span>

        <Link to={detailPath}>
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Open Deal Workspace
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default DealCard;
