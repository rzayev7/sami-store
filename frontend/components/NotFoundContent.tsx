"use client";

import Link from "./LocaleLink";
import { useLanguage } from "../context/LanguageContext";

export default function NotFoundContent() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-serif text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--color-gold)]">
        SAMÍ
      </p>

      <h1 className="mt-6 font-serif text-[4.5rem] font-light leading-none tracking-tight text-black/[0.08] sm:text-[6rem]">
        404
      </h1>

      <p className="mt-2 text-[15px] font-medium tracking-[0.02em] text-[var(--color-black)]">
        {t("notFound.title")}
      </p>

      <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--color-muted)]">
        {t("notFound.body")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="sami-btn-dark rounded-sm px-7 py-3 text-[11px] tracking-[0.14em]"
        >
          {t("common.viewCollection")}
        </Link>
        <Link
          href="/"
          className="sami-btn-light rounded-sm px-7 py-3 text-[11px] tracking-[0.14em]"
        >
          {t("common.backToHome")}
        </Link>
      </div>
    </div>
  );
}
