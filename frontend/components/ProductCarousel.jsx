"use client";

import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function chunk(children, size) {
  const arr = Children.toArray(children).filter(Boolean);
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function useItemsPerPage() {
  const [n, setN] = useState(2);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setN(6);
      else if (w >= 768) setN(4);
      else if (w >= 640) setN(3);
      else setN(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return n;
}

function gridClassForItemsPerPage(itemsPerPage) {
  switch (itemsPerPage) {
    case 6:
      return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
    case 4:
      return "grid-cols-2 md:grid-cols-4";
    case 3:
      return "grid-cols-2 sm:grid-cols-3";
    case 2:
    default:
      return "grid-cols-2";
  }
}

/**
 * Horizontal carousel in discrete full-width pages: each advance snaps to the next
 * set of products (slide → stop). Arrows, dots, touch scroll, optional auto-advance.
 */
export default function ProductCarousel({
  children,
  itemCount = 0,
  intervalMs = 5500,
  className = "",
}) {
  const itemsPerPage = useItemsPerPage();
  const pages = useMemo(
    () => chunk(children, itemsPerPage),
    [children, itemsPerPage]
  );
  const pageCount = pages.length;

  const scrollerRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pauseRef = useRef(false);

  useEffect(() => {
    setPageIndex(0);
    const el = scrollerRef.current;
    if (el) el.scrollLeft = 0;
  }, [itemsPerPage, itemCount]);

  const syncPageFromScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth <= 0 || pageCount <= 0) return;
    const w = el.clientWidth;
    const idx = Math.round(el.scrollLeft / w);
    setPageIndex(Math.min(pageCount - 1, Math.max(0, idx)));
  }, [pageCount]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    syncPageFromScroll();
    el.addEventListener("scroll", syncPageFromScroll, { passive: true });
    return () => el.removeEventListener("scroll", syncPageFromScroll);
  }, [syncPageFromScroll, pages]);

  useEffect(() => {
    const onVis = () => {
      pauseRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (pageCount <= 1) return;
    const id = window.setInterval(() => {
      if (pauseRef.current) return;
      const el = scrollerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const current = Math.round(el.scrollLeft / w);
      const next = current >= pageCount - 1 ? 0 : current + 1;
      el.scrollTo({ left: next * w, behavior: "smooth" });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [pageCount, intervalMs]);

  const goPage = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const current = Math.round(el.scrollLeft / w);
    const next = Math.max(0, Math.min(pageCount - 1, current + dir));
    el.scrollTo({ left: next * w, behavior: "smooth" });
  };

  const goToPageDot = (i) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const gridClass = gridClassForItemsPerPage(itemsPerPage);

  if (pageCount === 0) {
    return null;
  }

  return (
    <div
      className={`relative mx-auto max-w-[1400px] overflow-visible px-4 sm:px-8 lg:px-10 ${className}`}
      onMouseEnter={() => {
        pauseRef.current = true;
      }}
      onMouseLeave={() => {
        pauseRef.current = false;
      }}
    >
      {pageCount > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous page"
            className="absolute -left-2 top-[26%] z-10 flex -translate-y-1/2 rounded-full border border-black/[0.08] bg-white/95 p-1.5 text-black/45 shadow-sm backdrop-blur-sm transition-colors hover:border-black/15 hover:text-black sm:-left-5 sm:p-2 lg:-left-8"
            onClick={() => goPage(-1)}
          >
            <ChevronLeft size={20} strokeWidth={1.4} />
          </button>
          <button
            type="button"
            aria-label="Next page"
            className="absolute -right-2 top-[26%] z-10 flex -translate-y-1/2 rounded-full border border-black/[0.08] bg-white/95 p-1.5 text-black/45 shadow-sm backdrop-blur-sm transition-colors hover:border-black/15 hover:text-black sm:-right-5 sm:p-2 lg:-right-8"
            onClick={() => goPage(1)}
          >
            <ChevronRight size={20} strokeWidth={1.4} />
          </button>
        </>
      )}

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pages.map((pageItems, pi) => (
          <div
            key={pi}
            className={`grid w-full min-w-full shrink-0 snap-start gap-5 ${gridClass}`}
          >
            {pageItems.map((child, ci) => (
              <div key={ci} className="min-w-0">
                {child}
              </div>
            ))}
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to page ${i + 1}`}
              aria-current={i === pageIndex ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all ${
                i === pageIndex
                  ? "w-6 bg-black/50"
                  : "w-1.5 bg-black/15 hover:bg-black/25"
              }`}
              onClick={() => goToPageDot(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
