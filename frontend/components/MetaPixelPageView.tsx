"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { META_PIXEL_ID, trackMetaPageView } from "../lib/meta-pixel";

export default function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialPath = useRef(true);

  useEffect(() => {
    if (!META_PIXEL_ID) return;

    if (isInitialPath.current) {
      isInitialPath.current = false;
      return;
    }

    trackMetaPageView();
  }, [pathname, searchParams]);

  return null;
}
