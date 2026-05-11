/**
 * Meta (Facebook) Pixel ID.
 * Defaults to the production pixel. Set `NEXT_PUBLIC_META_PIXEL_ID` to override, or `""` to disable.
 */
const raw = process.env.NEXT_PUBLIC_META_PIXEL_ID;
export const META_PIXEL_ID =
  raw !== undefined ? raw.trim() : "1298917032196278";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Client-side route change (initial load is covered by the bootstrap snippet). */
export function trackMetaPageView() {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "PageView");
}
