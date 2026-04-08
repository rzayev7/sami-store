"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const ROWS = [
  { size: "XS", bust: 82, waist: 62, hip: 88 },
  { size: "S", bust: 86, waist: 66, hip: 92 },
  { size: "M", bust: 90, waist: 70, hip: 96 },
  { size: "L", bust: 96, waist: 76, hip: 102 },
  { size: "XL", bust: 102, waist: 82, hip: 108 },
];

export default function SizeGuide({ className = "" }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-[11px] font-normal tracking-[0.12em] text-black/45 underline-offset-4 transition-colors hover:text-black/65 hover:underline ${className}`}
      >
        {t("product.sizeChart")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--color-line)] bg-[var(--color-cream)] shadow-2xl sm:max-h-[85vh] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
              <h2 id={titleId} className="font-serif text-lg font-light tracking-[0.02em] text-[var(--color-black)]">
                {t("product.sizeGuide")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-black/50 transition-colors hover:bg-black/5 hover:text-black"
                aria-label={t("common.close")}
              >
                <X size={20} strokeWidth={1.8} />
              </button>
            </div>
            <div className="overflow-auto px-5 py-4">
              <p className="text-[12px] leading-relaxed text-black/55">
                {t("product.sizeGuideBody")}
              </p>
              <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--color-line)] bg-white">
                <table className="w-full min-w-[320px] text-start text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] bg-[var(--color-sand)]/40 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/55">
                      <th className="px-3 py-2.5">{t("product.thSize")}</th>
                      <th className="px-3 py-2.5">{t("product.thBust")}</th>
                      <th className="px-3 py-2.5">{t("product.thWaist")}</th>
                      <th className="px-3 py-2.5">{t("product.thHip")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row.size} className="border-b border-[var(--color-line)] last:border-0">
                        <td className="px-3 py-2.5 font-medium tabular-nums text-[var(--color-black)]">
                          {row.size}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-black/75">{row.bust}</td>
                        <td className="px-3 py-2.5 tabular-nums text-black/75">{row.waist}</td>
                        <td className="px-3 py-2.5 tabular-nums text-black/75">{row.hip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
