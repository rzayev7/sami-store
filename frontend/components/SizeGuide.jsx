"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const ROWS = [
  {
    size: "S",
    international: "36",
    russian: "42",
    turkish: "36",
    bust: "82-86",
    waist: "62-66",
    hip: "88-92",
  },
  {
    size: "M",
    international: "38",
    russian: "44",
    turkish: "38",
    bust: "86-90",
    waist: "66-70",
    hip: "92-96",
  },
  {
    size: "L",
    international: "40",
    russian: "46",
    turkish: "40",
    bust: "90-96",
    waist: "70-76",
    hip: "96-102",
  },
  {
    size: "XL",
    international: "42",
    russian: "48",
    turkish: "42",
    bust: "96-102",
    waist: "76-82",
    hip: "102-108",
  },
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
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col rounded-t-2xl border border-[var(--color-line)] bg-[var(--color-cream)] shadow-2xl sm:max-h-[85vh] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-4">
              <h2 id={titleId} className="font-serif text-[1.75rem] font-light tracking-[0.01em] text-[var(--color-black)]">
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
            <div className="overflow-auto px-6 py-5">
              <p className="text-[13px] leading-relaxed text-black/55">
                {t("product.sizeGuideBody")}
              </p>
              <div className="mt-4 rounded-xl border border-[var(--color-line)] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
                <p className="text-[14px] font-semibold text-black/80">{t("product.oneSizeTitle")}</p>
                <p className="mt-1 text-[13px] text-black/65">{t("product.oneSizeFits")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-medium text-black/65">
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-sand)]/35 px-2.5 py-1">
                    {t("product.oneSizeEu")}
                  </span>
                  <span className="text-black/30">•</span>
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-sand)]/35 px-2.5 py-1">
                    {t("product.oneSizeRu")}
                  </span>
                  <span className="text-black/30">•</span>
                  <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-sand)]/35 px-2.5 py-1">
                    {t("product.oneSizeTr")}
                  </span>
                </div>
                <p className="mt-2 text-[12px] italic text-black/55">{t("product.oneSizeNote")}</p>
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--color-line)] bg-white">
                <table className="w-full min-w-[760px] text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--color-line)] bg-[var(--color-sand)]/40 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/55">
                      <th className="px-3 py-3 text-center">{t("product.thSize")}</th>
                      <th className="px-3 py-3 text-center">{t("product.thInternational")}</th>
                      <th className="px-3 py-3 text-center">{t("product.thRussian")}</th>
                      <th className="px-3 py-3 text-center">{t("product.thTurkish")}</th>
                      <th className="px-3 py-3 text-center">{t("product.thBust")}</th>
                      <th className="px-3 py-3 text-center">{t("product.thWaist")}</th>
                      <th className="px-3 py-3 text-center">{t("product.thHip")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((row) => (
                      <tr key={row.size} className="border-b border-[var(--color-line)] last:border-0">
                        <td className="px-3 py-3 text-center font-semibold tabular-nums text-[var(--color-black)]">
                          {row.size}
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums text-black/75">{row.international}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-black/75">{row.russian}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-black/75">{row.turkish}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-black/75">{row.bust}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-black/75">{row.waist}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-black/75">{row.hip}</td>
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
