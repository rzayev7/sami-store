/**
 * Shared promo configuration.
 * Edit here — changes apply to both the hero countdown and the product-page strip.
 */

export const PROMO_TITLE        = "New Season Arrivals";
export const PROMO_DISCOUNT     = "20% Off";
export const PROMO_PERIOD_DAYS  = 3;   // auto-renews every N days
export const PROMO_ANCHOR_MS    = new Date("2026-05-09T00:00:00Z").getTime();

// ─── Countdown helpers ────────────────────────────────────────────────────────

const PERIOD_MS = PROMO_PERIOD_DAYS * 24 * 60 * 60 * 1000;

export function getCountdownEnd() {
  const now = Date.now();
  return now + (PERIOD_MS - ((now - PROMO_ANCHOR_MS) % PERIOD_MS));
}

export function calcTimeLeft() {
  const diff = Math.max(0, getCountdownEnd() - Date.now());
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function pad(n) {
  return String(n).padStart(2, "0");
}
