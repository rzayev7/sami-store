"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCloudinaryVideoUrl, getCloudinaryPoster } from "../lib/image";

/**
 * Lazy-load Cloudinary card videos with three layers of protection:
 *
 *  1. IntersectionObserver — card must enter viewport before any network activity.
 *     posterUrl is also withheld until in-view (browsers eagerly fetch poster
 *     even with preload="none", so we gate it behind the same observer).
 *  2. Hover / touch — video src is set and loaded only on first interaction.
 *  3. Leave — video is paused and currentTime reset.
 */
export function useLazyCloudinaryCardVideo(rawUrl, deps = []) {
  const videoRef = useRef(null);
  const videoLoadedRef = useRef(false);
  const inViewRef = useRef(false);
  const containerRef = useRef(null);

  // Poster is only exposed to the DOM after the card enters the viewport.
  // This prevents the browser from fetching the poster for off-screen cards.
  const [activePosterUrl, setActivePosterUrl] = useState("");

  const deliveryUrl = rawUrl ? getCloudinaryVideoUrl(rawUrl, { width: 400 }) : "";
  const rawPosterUrl = rawUrl ? (getCloudinaryPoster(rawUrl, { width: 400 }) ?? "") : "";

  // Reset when the product changes (e.g. inside a carousel).
  useEffect(() => {
    videoLoadedRef.current = false;
    inViewRef.current = false;
    setActivePosterUrl("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes identity deps
  }, deps);

  useEffect(() => {
    if (!deliveryUrl) return;
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === "undefined") {
      inViewRef.current = true;
      setActivePosterUrl(rawPosterUrl);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          // Reveal poster only once the card is actually visible.
          setActivePosterUrl((prev) => prev || rawPosterUrl);
        } else {
          const v = videoRef.current;
          if (v && !v.paused) {
            v.pause();
            v.currentTime = 0;
          }
        }
      },
      { rootMargin: "100px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  // rawPosterUrl is derived from rawUrl which is covered by deps reset above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryUrl]);

  const loadAndPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !deliveryUrl || !inViewRef.current) return;

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

  return {
    videoRef,
    containerRef,
    deliveryUrl,
    posterUrl: activePosterUrl,
    hoverHandlers,
    loadAndPlay,
    stop,
  };
}
