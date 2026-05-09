"use client";

import { useEffect, useState } from "react";
import { PROMO_TITLE, PROMO_DISCOUNT, calcTimeLeft, pad } from "../lib/promoConfig";

const UNITS  = ["days", "hours", "minutes", "seconds"];
const LABELS = { days: "Day", hours: "Hrs", minutes: "Mins", seconds: "Secs" };

export default function PromoCountdownStrip() {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-sm border border-[var(--color-gold)]/40 bg-[#fdf6ec] px-4 py-3.5 text-center shadow-[0_2px_12px_rgba(166,139,91,0.10)]">
      {/* Promo label */}
      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--color-gold)]">
        -{PROMO_DISCOUNT} &nbsp;·&nbsp; {PROMO_TITLE}
      </p>
      <p className="mt-1 text-[11px] tracking-[0.04em] text-black/50">
        Auto-applied at checkout &nbsp;·&nbsp;{" "}
        <span className="font-semibold text-[var(--color-gold)]">Ending soon</span>
      </p>

      {/* Countdown */}
      <div className="mt-3 flex items-center justify-center gap-3">
        {UNITS.map((unit, i) => (
          <div key={unit} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="font-serif text-[1.6rem] font-light leading-none tabular-nums text-[var(--color-gold)]">
                {pad(timeLeft[unit])}
              </span>
              <span className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.22em] text-black/40">
                {LABELS[unit]}
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
