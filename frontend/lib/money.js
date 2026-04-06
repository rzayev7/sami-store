/**
 * Stored catalog prices are plain numbers (same currency as entered in admin).
 * Rounding uses Math.round only — no EPSILON / FX — so values like 180 stay 180.
 */

/** Round to 2 decimal places (cent precision). */
export function roundPriceCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100) / 100;
}

/**
 * Parse admin price field string (no currency conversion).
 * Trims, accepts comma decimals, rounds to cents.
 */
export function parseAdminPriceInput(raw) {
  const s = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (s === "") return NaN;
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100) / 100;
}

/** Show stored number in admin inputs without float noise (e.g. 180 not 180.019999…). */
export function formatAdminPriceField(value) {
  if (value == null || value === "") return "";
  const n = roundPriceCents(Number(value));
  if (!Number.isFinite(n)) return "";
  return String(n);
}
