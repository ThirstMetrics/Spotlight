// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format a number as currency.
 *
 * @param amount  - The numeric amount to format.
 * @param currency - ISO 4217 currency code (default: 'USD').
 * @returns Formatted currency string (e.g. "$1,234.56").
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a percentage string.
 *
 * @param value    - The numeric value (e.g. 0.85 for 85%, or 85 for 85%).
 * @param decimals - Number of decimal places (default: 1).
 * @returns Formatted percentage string (e.g. "85.0%").
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date into a human-readable string.
 *
 * @param date   - Date object or ISO string to format.
 * @param format - Output format: 'short' (MM/DD/YYYY), 'long' (Month DD, YYYY), 'iso' (YYYY-MM-DD).
 * @returns Formatted date string.
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      }).format(d);

    case 'long':
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(d);

    case 'iso':
      return d.toISOString().split('T')[0];

    default:
      return d.toLocaleDateString('en-US');
  }
}

/**
 * Format a number with locale-aware thousand separators and decimal places.
 *
 * @param value    - The numeric value to format.
 * @param decimals - Number of decimal places (default: 0).
 * @returns Formatted number string (e.g. "1,234").
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
