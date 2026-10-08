import React from 'react';
import { Star } from 'lucide-react';

export function RatingStars({ rating = 5, maxRating = 5, onRate, size = 'md', interactive = false }) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, idx) => {
        const starNum = idx + 1;
        const isFilled = starNum <= Math.round(rating);

        return (
          <button
            key={idx}
            type="button"
            disabled={!interactive}
            onClick={() => onRate && onRate(starNum)}
            className={`transition-colors ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            }`}
          >
            <Star
              className={`${starSize} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-100 text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

export default RatingStars;
