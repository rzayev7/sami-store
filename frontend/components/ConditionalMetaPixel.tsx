"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import MetaPixelPageView from "./MetaPixelPageView";
import MetaPixelScripts from "./MetaPixelScripts";

function isAdminPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return true;
  return /^\/(en|ar|ru|uz|fr)\/admin(\/|$)/.test(pathname);
}

export default function ConditionalMetaPixel() {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;

  return (
    <>
      <MetaPixelScripts />
      <Suspense fallback={null}>
        <MetaPixelPageView />
      </Suspense>
    </>
  );
}
