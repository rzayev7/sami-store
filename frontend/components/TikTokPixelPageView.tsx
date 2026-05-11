"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { TIKTOK_PIXEL_ID, trackTikTokPage } from "../lib/tiktok-pixel";

export default function TikTokPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialPath = useRef(true);

  useEffect(() => {
    if (!TIKTOK_PIXEL_ID) return;

    if (isInitialPath.current) {
      isInitialPath.current = false;
      return;
    }

    trackTikTokPage();
  }, [pathname, searchParams]);

  return null;
}
