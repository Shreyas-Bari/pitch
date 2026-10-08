/**
 * Image and media URL resolution utilities
 * Ensures high-quality photography fallbacks for campus events and profile avatars.
 */

// Curated high-resolution photography for campus event categories
const CATEGORY_FALLBACK_IMAGES = {
  Technical: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
  Cultural: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
  Management: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  Literary: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
  Entrepreneurship: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  'Social Impact': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80',
  'Fine Arts': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
  'Gaming / Esports': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  Festival: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
  Default: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
};

/**
 * Get display image URL for an event
 */
export function getEventImageUrl(event) {
  if (!event) return CATEGORY_FALLBACK_IMAGES.Default;

  // 1. Populated File object
  if (event.bannerFileId && typeof event.bannerFileId === 'object' && event.bannerFileId.url) {
    return event.bannerFileId.url;
  }

  // 2. Direct URL property
  if (event.bannerUrl && typeof event.bannerUrl === 'string' && event.bannerUrl.startsWith('http')) {
    return event.bannerUrl;
  }

  // 3. Category thematic fallback
  if (event.category && CATEGORY_FALLBACK_IMAGES[event.category]) {
    return CATEGORY_FALLBACK_IMAGES[event.category];
  }

  return CATEGORY_FALLBACK_IMAGES.Default;
}

/**
 * Get category fallback photography
 */
export function getCategoryFallback(category) {
  return CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.Default;
}

/**
 * Get logo or avatar URL
 */
export function getAvatarImageUrl(entity) {
  if (!entity) return null;

  if (entity.logoFileId && typeof entity.logoFileId === 'object' && entity.logoFileId.url) {
    return entity.logoFileId.url;
  }

  if (entity.avatar && typeof entity.avatar === 'string' && entity.avatar.startsWith('http')) {
    return entity.avatar;
  }

  if (entity.logoUrl && typeof entity.logoUrl === 'string' && entity.logoUrl.startsWith('http')) {
    return entity.logoUrl;
  }

  return null;
}
