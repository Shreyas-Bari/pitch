import React from 'react';
import { Award, Star, CheckCircle, Shield } from 'lucide-react';
import Card from '../ui/Card';

/**
 * ReputationSummary
 * Visual presentation of platform-earned reputation based strictly on completed PITCH deals.
 */
export function ReputationSummary({ reviews = [], verifiedDeals = [], stats = null, className = '' }) {
  const dealsCount = verifiedDeals.length || stats?.completedDeals || 0;
  const reviewsCount = reviews.length;

  const averageRating = reviewsCount > 0
    ? (reviews.reduce((acc, r) => acc + (r.overallRating || r.rating || 5), 0) / reviewsCount).toFixed(1)
    : null;

  return (
    <Card className={`p-5 bg-gradient-to-br from-white to-slate-50 border-slate-200 ${className}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-pitch-blue flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-pitch-text">PITCH Platform Reputation</h4>
            <p className="text-[11px] text-pitch-muted">Based strictly on completed deals & reciprocal reviews</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <Shield className="w-3 h-3" />
          Platform Verified
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="text-2xl font-bold font-display text-pitch-navy">
            {dealsCount}
          </div>
          <div className="text-xs text-pitch-muted font-medium mt-0.5">
            Completed Deals
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          {averageRating ? (
            <div className="flex items-center justify-center gap-1 text-2xl font-bold font-display text-pitch-navy">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>{averageRating}</span>
              <span className="text-xs text-pitch-muted font-normal">/5</span>
            </div>
          ) : (
            <div className="text-2xl font-bold font-display text-slate-400">
              —
            </div>
          )}
          <div className="text-xs text-pitch-muted font-medium mt-0.5">
            {reviewsCount > 0 ? `${reviewsCount} Review${reviewsCount > 1 ? 's' : ''}` : 'No Reviews Yet'}
          </div>
        </div>
      </div>

      {dealsCount === 0 && (
        <p className="text-xs text-slate-500 text-center mt-3 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-100">
          This organization is new to PITCH. Historical offline records (if any) are displayed below under Self-Reported History.
        </p>
      )}
    </Card>
  );
}

export default ReputationSummary;
