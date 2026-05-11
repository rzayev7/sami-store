"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import TikTokPixelPageView from "./TikTokPixelPageView";
import TikTokPixelScripts from "./TikTokPixelScripts";

function isAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return true;
  return /^\/(en|ar|ru|uz)\/admin(\/|$)/.test(pathname);
}

export default function ConditionalTikTokPixel() {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;

  return (
    <>
      <TikTokPixelScripts />
      <Suspense fallback={null}>
        <TikTokPixelPageView />
      </Suspense>
    </>
  );
}
