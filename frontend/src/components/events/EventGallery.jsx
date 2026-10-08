import React, { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import Card from '../ui/Card';

export function EventGallery({ media = [], className = '' }) {
  const [activeImage, setActiveImage] = useState(null);

  if (!media || media.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-pitch-blue" />
        <h3 className="font-display font-bold text-base text-pitch-navy">
          Fest & Campus Gallery
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {media.map((item, idx) => {
          const url = typeof item === 'object' ? item.url : item;
          if (!url) return null;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImage(url)}
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 group border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-pitch-blue"
            >
              <img
                src={url}
                alt={`Event media ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setActiveImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setActiveImage(null)}
              className="absolute -top-10 right-0 p-1 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeImage}
              alt="Enlarged media"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EventGallery;
