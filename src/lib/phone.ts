/**
 * Normalizes an Egyptian mobile number to the local 11-digit form (01XXXXXXXXX).
 * Accepts "010 1234 5678", "+20 10 1234 5678", "00201012345678", "201012345678".
 * Returns null when the result is not a valid 010/011/012/015 number.
 */
export function normalizeEgyptPhone(input: unknown): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(2);
  if (digits.startsWith("20") && digits.length === 12) digits = "0" + digits.slice(2);
  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
