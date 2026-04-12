"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GA_MEASUREMENT_ID, sendPageView } from "../lib/gtag";

export default function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const search = searchParams?.toString();
    const pathWithQuery = search ? `${pathname}?${search}` : pathname;

    sendPageView(pathWithQuery);
  }, [pathname, searchParams]);

  return null;
}
