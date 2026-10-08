import React, { useState } from 'react';

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg font-bold',
};

const bgColors = [
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-slate-700',
  'bg-teal-600',
  'bg-emerald-600',
];

function getInitials(name = '') {
  if (!name) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorByName(name = '') {
  if (!name) return bgColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({
  src,
  name,
  alt,
  size = 'md',
  className = '',
  role,
}) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const bgColor = getColorByName(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none ${
        sizes[size] || sizes.md
      } ${className}`}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-semibold text-white ${bgColor}`}
          aria-label={name || 'Avatar'}
        >
          {initials}
        </div>
      )}

      {role && (
        <span
          title={role}
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${
            role === 'ADMIN'
              ? 'bg-purple-600'
              : role === 'COMMITTEE'
              ? 'bg-emerald-500'
              : 'bg-pitch-blue'
          } ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`}
        />
      )}
    </div>
  );
}

export default Avatar;
