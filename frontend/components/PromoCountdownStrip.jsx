"use client";

import { useEffect, useState } from "react";
import { calcTimeLeft, pad } from "../lib/promoConfig";
import { useLanguage } from "../context/LanguageContext";

const UNITS = ["days", "hours", "minutes", "seconds"];

function unitKey(unit) {
  const map = {
    days: "promoStrip.daysShort",
    hours: "promoStrip.hoursShort",
    minutes: "promoStrip.minutesShort",
    seconds: "promoStrip.secondsShort",
  };
  return map[unit];
}

export default function PromoCountdownStrip() {
  const { t, dir } = useLanguage();
  const title = t("promoHero.title");
  const discount = t("promoHero.discount");

  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calcTimeLeft());
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-sm border border-[var(--color-gold)]/40 bg-[#fdf6ec] px-4 py-3.5 text-center shadow-[0_2px_12px_rgba(166,139,91,0.10)]"
      dir={dir}
    >
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--color-gold)]">
        -{discount} &nbsp;·&nbsp; {title}
      </p>
      <p className="mt-1 text-[11px] tracking-[0.04em] text-black/50">
        {t("promoStrip.autoApplied")} &nbsp;·&nbsp;{" "}
        <span className="font-semibold text-[var(--color-gold)]">
          {t("promoStrip.endingSoon")}
        </span>
      </p>

      <div className="mt-3 flex items-center justify-center gap-3" dir={dir === "rtl" ? "rtl" : "ltr"}>
        {UNITS.map((unit, i) => (
          <div key={unit} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span
                className="font-serif text-[1.6rem] font-light leading-none tabular-nums text-[var(--color-gold)]"
                suppressHydrationWarning
              >
                {mounted ? pad(timeLeft[unit]) : "00"}
              </span>
              <span className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.22em] text-black/40">
                {t(unitKey(unit))}
              </span>
            </div>
            {i < UNITS.length - 1 && (
              <span className="mb-4 text-[1.1rem] font-light text-[var(--color-gold)]/50" aria-hidden>
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
