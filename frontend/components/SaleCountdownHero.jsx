"use client";

import Image from "next/image";
import Link from "./LocaleLink";
import { useEffect, useState } from "react";
import { calcTimeLeft, pad } from "../lib/promoConfig";
import { useLanguage } from "../context/LanguageContext";

const PROMO_IMAGE = "/hero6.png";

const UNITS = ["days", "hours", "minutes", "seconds"];

/** Fallback English copy when keys missing */
function unitLabelKey(unit) {
  const map = {
    days: "promoHero.daysShort",
    hours: "promoHero.hoursShort",
    minutes: "promoHero.minutesShort",
    seconds: "promoHero.secondsShort",
  };
  return map[unit];
}

export default function SaleCountdownHero() {
  const { t, dir } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const label = t("promoHero.label");
  const title = t("promoHero.title");
  const discount = t("promoHero.discount");
  const subtitle = t("promoHero.subtitle");
  const cta = t("promoHero.cta");

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calcTimeLeft());
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="full-bleed -mt-6 h-screen max-w-none overflow-hidden sm:-mt-8"
      aria-label={`${title} — ${cta}`}
    >
      <Image
        src={PROMO_IMAGE}
        alt={`${title} — SAMÍ`}
        fill
        sizes="100vw"
        quality={95}
        priority
        unoptimized
        className="object-cover"
        style={{ objectPosition: "50% 18%" }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/65"
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="hero-content-fade flex flex-col items-center" dir={dir === "rtl" ? "rtl" : "ltr"}>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.52em] text-[var(--color-gold-soft)]">
            {label}
          </p>

          <div className="mt-4 h-px w-10 bg-[var(--color-gold-soft)]/50" aria-hidden />

          <h1 className="mt-5 font-serif text-[clamp(2.4rem,6vw,4.4rem)] font-light leading-[1.07] tracking-[0.05em] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.5)]">
            {title}
          </h1>

          <p className="mt-2 font-serif text-[clamp(1.5rem,4vw,2.75rem)] font-light tracking-[0.1em] text-[var(--color-gold-soft)] drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
            {discount}
          </p>

          <p className="mx-auto mt-5 max-w-xs text-[13px] font-light italic leading-[1.85] tracking-[0.04em] text-white/68 sm:max-w-sm sm:text-[14.5px]">
            {subtitle}
          </p>

          <Link
            href="/products"
            className="group mt-9 inline-flex min-h-[50px] items-center justify-center gap-2.5 border border-white/22 bg-white px-11 py-3.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-black)] shadow-[0_8px_36px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-all duration-500 hover:bg-[#f5f0e8] hover:shadow-[0_12px_44px_rgba(0,0,0,0.28)]"
          >
            {cta}
            <span
              className={`text-[13px] transition-transform duration-300 ${dir === "rtl" ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`}
              aria-hidden
            >
              {dir === "rtl" ? "←" : "→"}
            </span>
          </Link>

          <div
            className="mt-12 flex items-start gap-5 sm:gap-8"
            dir={dir === "rtl" ? "rtl" : "ltr"}
          >
            {UNITS.map((unit, i) => (
              <div key={unit} className="flex items-start gap-5 sm:gap-8">
                <div className="flex flex-col items-center">
                  <span
                    className="font-serif text-[2.2rem] font-light leading-none tabular-nums text-white sm:text-[2.8rem]"
                    suppressHydrationWarning
                  >
                    {mounted ? pad(timeLeft[unit]) : "00"}
                  </span>
                  <span className="mt-2 text-[8px] font-semibold uppercase tracking-[0.3em] text-white/50">
                    {t(unitLabelKey(unit))}
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
