"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { videoFilterStyle } from "../lib/videoAdjustments";

/**
 * Fills a portrait (or any) box with `object-cover`.
 * When the browser reports landscape pixel dimensions (width &gt; height) — common when
 * rotation metadata from phone footage is ignored (e.g. Yandex Browser) — we rotate
 * 90° and scale so the frame still covers the container like a normal portrait clip.
 *
 * Set `disablePortraitFix` when the file is intentionally landscape (wide) so we do not rotate.
 */
const PortraitCoverVideo = forwardRef(function PortraitCoverVideo(
  {
    src,
    wrapperClassName = "",
    videoClassName = "",
    videoAdjustments,
    disablePortraitFix = false,
    style: videoStyleProp,
    onLoadedMetadata,
    ...rest
  },
  ref,
) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      videoRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const [fixStyle, setFixStyle] = useState(null);

  const recompute = useCallback(() => {
    const v = videoRef.current;
    const box = wrapRef.current;
    if (!v || !box || disablePortraitFix) {
      setFixStyle(null);
      return;
    }
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h || w <= h) {
      setFixStyle(null);
      return;
    }
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    if (!cw || !ch) return;
    const vw = h;
    const vh = w;
    const scale = Math.max(cw / vw, ch / vh);
    setFixStyle({
      position: "absolute",
      left: "50%",
      top: "50%",
      width: w,
      height: h,
      transform: `translate(-50%, -50%) rotate(90deg) scale(${scale})`,
      transformOrigin: "center center",
      objectFit: "cover",
    });
  }, [disablePortraitFix]);

  const handleLoadedMetadata = useCallback(
    (e) => {
      recompute();
      onLoadedMetadata?.(e);
    },
    [recompute, onLoadedMetadata],
  );

  useEffect(() => {
    setFixStyle(null);
  }, [src]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => recompute());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [recompute, src]);

  const filterStyle = videoFilterStyle(videoAdjustments);
  const mergedStyle =
    fixStyle != null
      ? { ...fixStyle, ...filterStyle, ...videoStyleProp }
      : { ...filterStyle, ...videoStyleProp };

  const videoPositionClasses =
    fixStyle != null
      ? `absolute object-cover ${videoClassName}`.trim()
      : `absolute inset-0 h-full w-full object-cover ${videoClassName}`.trim();

  return (
    <div ref={wrapRef} className={wrapperClassName}>
      <video
        ref={setRefs}
        src={src}
        className={videoPositionClasses}
        style={mergedStyle}
        onLoadedMetadata={handleLoadedMetadata}
        {...rest}
      />
    </div>
  );
});

export default PortraitCoverVideo;
