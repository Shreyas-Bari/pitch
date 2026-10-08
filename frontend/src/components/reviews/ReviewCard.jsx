import React from 'react';
import { ShieldCheck, User } from 'lucide-react';
import RatingStars from './RatingStars';
import { formatDate } from '../../utils/formatDate';

export function ReviewCard({ review }) {
  if (!review) return null;

  const reviewerName =
    typeof review.reviewerUserId === 'object'
      ? review.reviewerUserId?.name || review.reviewerUserId?.fullName
      : 'Verified Participant';

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <RatingStars rating={review.rating} size="sm" />
            <span className="font-extrabold text-xs text-slate-900 font-display">
              {review.rating}.0 / 5.0
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> PITCH Verified
            </span>
          </div>

          {review.title && (
            <h5 className="font-bold text-xs text-slate-900 mt-1.5">
              {review.title}
            </h5>
          )}
        </div>

        <span className="text-[11px] text-slate-400 shrink-0">
          {formatDate(review.createdAt)}
        </span>
      </div>

      {review.comment && (
        <p className="text-xs text-slate-600 leading-relaxed">
          {review.comment}
        </p>
      )}

      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
        <User className="w-3 h-3" />
        <span>By {reviewerName}</span>
      </div>
    </div>
  );
}

export default ReviewCard;
