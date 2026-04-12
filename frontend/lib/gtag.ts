export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function sendPageView(pathWithQuery: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;

  const pagePath = pathWithQuery.startsWith("/")
    ? pathWithQuery
    : `/${pathWithQuery}`;

  gtag("event", "page_view", {
    page_path: pagePath,
    page_title: document.title,
    page_location: `${window.location.origin}${pagePath}`,
  });
}
