"use client";

import Image from "next/image";
import Link from "./LocaleLink";
import { useEffect, useState } from "react";

// ─── PROMO CONFIG ─────────────────────────────────────────────────────────────
// Edit these values to update the promotion. No other changes needed.
const PROMO_LABEL      = "Limited Time Offer";
const PROMO_TITLE      = "New Season Arrivals";
const PROMO_DISCOUNT   = "20% Off";
const PROMO_SUBTITLE   = "Discover Your Signature Look";
const PROMO_CTA        = "Shop the Sale";
const PROMO_IMAGE      = "/hero6.png";
const PROMO_PERIOD_DAYS = 3; // countdown length — resets automatically every N days
// Fixed anchor: the moment the first promotion period started.
// Changing this shifts when the counter resets. Leave it as-is for perpetual renewal.
const PROMO_ANCHOR_MS  = new Date("2026-05-09T00:00:00Z").getTime();
// ──────────────────────────────────────────────────────────────────────────────

const PERIOD_MS = PROMO_PERIOD_DAYS * 24 * 60 * 60 * 1000;

function getCountdownEnd() {
  const now = Date.now();
  const elapsed = (now - PROMO_ANCHOR_MS) % PERIOD_MS;
  return now + (PERIOD_MS - elapsed);
}

function calcTimeLeft() {
  const diff = Math.max(0, getCountdownEnd() - Date.now());
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

const UNITS = ["days", "hours", "minutes", "seconds"];
const LABELS = { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" };

export default function SaleCountdownHero() {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="full-bleed -mt-6 h-screen max-w-none overflow-hidden sm:-mt-8"
      aria-label={`${PROMO_TITLE} sale`}
    >
      {/* Background */}
      <Image
        src={PROMO_IMAGE}
        alt={`${PROMO_TITLE} — SAMÍ`}
        fill
        sizes="100vw"
        quality={95}
        priority
        unoptimized
        className="object-cover"
        style={{ objectPosition: "50% 18%" }}
      />
      {/* Layered dark overlay — stronger at bottom to ground the content */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/65"
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="hero-content-fade flex flex-col items-center">

          {/* Gold label */}
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.52em] text-[var(--color-gold-soft)]">
            {PROMO_LABEL}
          </p>

          {/* Divider line */}
          <div className="mt-4 h-px w-10 bg-[var(--color-gold-soft)]/50" aria-hidden />

          {/* Title */}
          <h1 className="mt-5 font-serif text-[clamp(2.4rem,6vw,4.4rem)] font-light leading-[1.07] tracking-[0.05em] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.5)]">
            {PROMO_TITLE}
          </h1>

          {/* Discount badge */}
          <p className="mt-2 font-serif text-[clamp(1.5rem,4vw,2.75rem)] font-light tracking-[0.1em] text-[var(--color-gold-soft)] drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
            {PROMO_DISCOUNT}
          </p>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-xs text-[13px] font-light italic leading-[1.85] tracking-[0.04em] text-white/68 sm:max-w-sm sm:text-[14.5px]">
            {PROMO_SUBTITLE}
          </p>

          {/* CTA button */}
          <Link
            href="/products"
            className="mt-9 inline-flex min-h-[50px] items-center justify-center gap-2.5 border border-white/22 bg-white px-11 py-3.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-black)] shadow-[0_8px_36px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-all duration-500 hover:bg-[#f5f0e8] hover:shadow-[0_12px_44px_rgba(0,0,0,0.28)]"
          >
            {PROMO_CTA}
            <span className="text-[13px] transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
              →
            </span>
          </Link>

          {/* Countdown */}
          <div className="mt-12 flex items-start gap-5 sm:gap-8">
            {UNITS.map((unit, i) => (
              <div key={unit} className="flex items-start gap-5 sm:gap-8">
                <div className="flex flex-col items-center">
                  <span className="font-serif text-[2.2rem] font-light leading-none tabular-nums text-white sm:text-[2.8rem]">
                    {pad(timeLeft[unit])}
                  </span>
                  <span className="mt-2 text-[8px] font-semibold uppercase tracking-[0.3em] text-white/50">
                    {LABELS[unit]}
                  </span>
                </div>
                {i < UNITS.length - 1 && (
                  <span
                    className="mt-2 text-[1.5rem] font-extralight leading-none text-white/30 sm:text-[1.9rem]"
                    aria-hidden
                  >
                    |
                  </span>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
