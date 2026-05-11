"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import GoogleAnalyticsPageView from "./GoogleAnalyticsPageView";
import GoogleAnalyticsScripts from "./GoogleAnalyticsScripts";

function isAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return true;
  return /^\/(en|ar|ru|uz|fr)\/admin(\/|$)/.test(pathname);
}

export default function ConditionalGoogleAnalytics() {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;

  return (
    <>
      <GoogleAnalyticsScripts />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}
