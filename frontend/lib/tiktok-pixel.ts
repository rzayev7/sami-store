/**
 * TikTok Pixel ID (Events API / Web Pixel sdkid).
 * Set `NEXT_PUBLIC_TIKTOK_PIXEL_ID` to override, or `""` to disable.
 */
const raw = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
export const TIKTOK_PIXEL_ID =
  raw !== undefined ? raw.trim() : "D80QN4JC77UDOFSGH1EG";

declare global {
  interface Window {
    ttq?: { page?: (...args: unknown[]) => void };
  }
}

/** Client-side route change (initial load is covered by the bootstrap snippet). */
export function trackTikTokPage() {
  if (!TIKTOK_PIXEL_ID || typeof window === "undefined") return;
  const { ttq } = window;
  if (!ttq || typeof ttq.page !== "function") return;
  ttq.page();
}
