/**
 * Store phone numbers as digits only so "+91 98400 12345" and "9840012345"
 * are recognised as the same person. A leading Indian country code is dropped.
 */
export function normalizePhone(raw = '') {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}
