"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--color-gold)]">
        SAMÍ
      </p>

      <div className="mt-8 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-sand)]/40">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--color-muted)]"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <p className="mt-5 text-[15px] font-medium tracking-[0.02em] text-[var(--color-black)]">
        Something went wrong
      </p>

      <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--color-muted)]">
        An unexpected error occurred. Please try again, or return to the
        homepage if the problem persists.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="sami-btn-dark rounded-sm px-7 py-3 text-[11px] tracking-[0.14em]"
        >
          Try Again
        </button>
        <a
          href="/"
          className="sami-btn-light rounded-sm px-7 py-3 text-[11px] tracking-[0.14em]"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
