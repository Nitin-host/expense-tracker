/** Allow only digits and a single decimal point (for currency/amount fields). */
export function sanitizeDecimalInput(value) {
    if (value === '') return '';
    let cleaned = value.replace(/[^\d.]/g, '');
    const dotIndex = cleaned.indexOf('.');
    if (dotIndex !== -1) {
        cleaned =
            cleaned.slice(0, dotIndex + 1) +
            cleaned.slice(dotIndex + 1).replace(/\./g, '');
    }
    return cleaned;
}

/** Allow only whole digits (for year, quantity, etc.). */
export function sanitizeIntegerInput(value) {
    return value.replace(/\D/g, '');
}

/** Block arrow keys and scroll wheel from changing number inputs. */
export function blockNumberStepKeys(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
    }
}

export function blockNumberWheel(e) {
    e.currentTarget.blur();
}
