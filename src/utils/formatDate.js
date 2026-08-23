/**
 * Format a date as dd-mm-yyyy (app-wide display format).
 */
export function formatDate(value, { fallback = '—' } = {}) {
    if (value === undefined || value === null || value === '') return fallback;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}
