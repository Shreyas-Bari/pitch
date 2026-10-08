import React from 'react';
import {
  Banknote,
  Package,
  Utensils,
  Coffee,
  Shirt,
  Wrench,
  Briefcase,
  Building,
  Truck,
  Gift,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const typeIcons = {
  CASH: Banknote,
  PRODUCT: Package,
  FOOD: Utensils,
  BEVERAGE: Coffee,
  MERCHANDISE: Shirt,
  EQUIPMENT: Wrench,
  SERVICE: Briefcase,
  VENUE: Building,
  TRANSPORTATION: Truck,
  GIFT_HAMPER: Gift,
  OTHER: HelpCircle,
};

export function ContributionCard({ contribution, isCompact = false }) {
  if (!contribution) return null;

  // Handles both structured backend contribution format { types, cash, nonCash }
  // or individual contribution item { type, amount/quantity, name, ... }

  if (contribution.cash || Array.isArray(contribution.nonCash)) {
    const cashAmount = contribution.cash?.amount || 0;
    const nonCashItems = Array.isArray(contribution.nonCash) ? contribution.nonCash : [];

    return (
      <div className="space-y-2.5">
        {cashAmount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Cash Contribution
                </p>
                <p className="text-[11px] text-emerald-600">Direct sponsorship funding</p>
              </div>
            </div>
            <span className="text-sm font-extrabold text-emerald-950 font-display">
              {formatCurrency(cashAmount)}
            </span>
          </div>
        )}

        {nonCashItems.map((item, idx) => {
          const Icon = typeIcons[item.type] || Package;
          return (
            <div
              key={idx}
              className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                      {item.type}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {item.name || `${item.type} Item`}
                    </h5>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  {item.expectedDate && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>Delivery: {formatDate(item.expectedDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-extrabold text-slate-900">
                  {item.quantity?.toLocaleString() || 1} {item.unit || 'units'}
                </p>
                {item.estimatedValue > 0 && (
                  <p className="text-[10px] text-slate-500">
                    Est. {formatCurrency(item.estimatedValue)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Single item fallback
  const Icon = typeIcons[contribution.type] || Package;
  const isCash = contribution.type === 'CASH';

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-600" />
        <span className="font-semibold text-slate-900">{contribution.type}</span>
        {contribution.name && <span className="text-slate-500">• {contribution.name}</span>}
      </div>
      <div className="font-bold text-slate-900">
        {isCash
          ? formatCurrency(contribution.amount || 0)
          : `${contribution.quantity || 1} ${contribution.unit || 'units'}`}
      </div>
    </div>
  );
}

export default ContributionCard;
