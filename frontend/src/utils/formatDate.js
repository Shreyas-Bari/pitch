/**
 * Format date values cleanly for UI presentation
 *
 * @param {string|Date} date
 * @param {object} options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '—';

  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const { includeTime = false, format = 'medium' } = options;

  if (format === 'relative') {
    const diffMs = Date.now() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
  }

  const dateOptions = {
    year: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-IN', dateOptions).format(dateObj);
}

export default formatDate;
