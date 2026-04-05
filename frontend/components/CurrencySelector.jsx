"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { CURRENCIES, getCurrencyInfo } from "../lib/currency";

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = getCurrencyInfo(currency);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium tracking-[0.06em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-black)]"
      >
        <span>{current.flag}</span>
        <span>{current.code}</span>
        <ChevronDown size={12} strokeWidth={2} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 max-h-[min(70vh,22rem)] min-w-[200px] overflow-y-auto rounded-lg border border-[var(--color-line)] bg-white py-1 shadow-lg">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors hover:bg-[var(--color-cream)]/60 ${
                c.code === currency
                  ? "font-semibold text-[var(--color-black)]"
                  : "text-[var(--color-muted)]"
              }`}
            >
              <span className="text-sm">{c.flag}</span>
              <span className="flex-1">{c.name}</span>
              <span className="text-[11px] text-black/40">{c.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
