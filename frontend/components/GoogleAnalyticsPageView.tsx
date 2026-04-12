"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID, sendPageView } from "../lib/gtag";

export default function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialPath = useRef(true);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const search = searchParams?.toString();
    const pathWithQuery = search ? `${pathname}?${search}` : pathname;

    // First paint is covered by gtag('config', id) in the bootstrap script.
    // React effects can run before that script; skipping here avoids double counts and missed hits.
    if (isInitialPath.current) {
      isInitialPath.current = false;
      return;
    }

    sendPageView(pathWithQuery);
  }, [pathname, searchParams]);

  return null;
}
