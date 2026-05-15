"use client";

import { useCallback, useEffect, useRef } from "react";
import { getCloudinaryVideoUrl } from "../lib/image";

/**
 * Lazy-load Cloudinary card videos on hover/tap only (saves bandwidth on catalog pages).
 */
export function useLazyCloudinaryCardVideo(rawUrl, deps = []) {
  const videoRef = useRef(null);
  const videoLoadedRef = useRef(false);

  const deliveryUrl = rawUrl ? getCloudinaryVideoUrl(rawUrl, { width: 720 }) : "";

  useEffect(() => {
    videoLoadedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes identity deps (e.g. product id)
  }, deps);

  const loadAndPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !deliveryUrl) return;

    if (!videoLoadedRef.current) {
      videoLoadedRef.current = true;
      v.src = deliveryUrl;
      v.load();
    }

    void v.play().catch(() => {});
  }, [deliveryUrl]);

  const stop = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  }, []);

  const hoverHandlers = deliveryUrl
    ? {
        onMouseEnter: loadAndPlay,
        onMouseLeave: stop,
        onTouchStart: loadAndPlay,
      }
    : {};

  return { videoRef, deliveryUrl, hoverHandlers, loadAndPlay, stop };
}
