/**
 * Small, dependency-free validation helpers.
 *
 * Each function returns `null` when the value is valid, or an
 * error message string when it isn't. This lets a form do:
 *
 *   const error = required(value, "Student name") ?? isPhone(value);
 *
 * i.e. "check required first, and only run the next check if that passed".
 */

export function required(value: string, fieldName: string): string | null {
  return value.trim().length > 0 ? null : `${fieldName} is required.`;
}

export function isEmail(value: string): string | null {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value) ? null : "Enter a valid email address.";
}

export function isPhone(value: string): string | null {
  const pattern = /^\d{10}$/;
  return pattern.test(value) ? null : "Enter a valid 10-digit contact number.";
}

export function minLength(value: string, length: number, fieldName: string): string | null {
  return value.length >= length ? null : `${fieldName} must be at least ${length} characters.`;
}

/** Business rule: a date field (e.g. attendance date, joining date) can't be later than today. */
export function notFutureDate(value: string, fieldName: string): string | null {
  const today = new Date().toISOString().slice(0, 10);
  return value <= today ? null : `${fieldName} cannot be a future date.`;
}

export function isPositiveNumber(value: string, fieldName: string): string | null {
  const num = Number(value);
  return !Number.isNaN(num) && num > 0 ? null : `${fieldName} must be a positive number.`;
}
