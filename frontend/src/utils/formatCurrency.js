/**
 * Format numeric currency amounts in INR (₹)
 *
 * @param {number|string} amount
 * @param {object} options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, options = {}) {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);

  if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
    return '₹0';
  }

  const { compact = false, showDecimals = false } = options;

  if (compact && numericAmount >= 10000000) {
    return `₹${(numericAmount / 10000000).toFixed(1)} Cr`;
  }
  if (compact && numericAmount >= 100000) {
    return `₹${(numericAmount / 100000).toFixed(1)} L`;
  }
  if (compact && numericAmount >= 1000) {
    return `₹${(numericAmount / 1000).toFixed(1)}k`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(numericAmount);
}

export default formatCurrency;
