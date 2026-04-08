"use client";

import Link from "../../components/LocaleLink";
import { SUPPORT_EMAIL } from "../../lib/sitePublic";
import { useLanguage } from "../../context/LanguageContext";

export default function ReturnsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          {t("common.home")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">{t("returns.title")}</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        {t("returns.title")}
      </h1>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("returns.allSalesFinal")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("returns.allSalesBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("returns.damagedItems")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("returns.damagedBody")}
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("returns.damagedInclude")}
        </p>
        <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-[1.85] text-black/70">
          <li>{t("returns.includeOrderNumber")}</li>
          <li>{t("returns.includeDescription")}</li>
          <li>{t("returns.includePhotos")}</li>
        </ul>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("returns.damagedResolution")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("returns.howToReach")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("returns.howToReachBody")}{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {SUPPORT_EMAIL}
          </a>
          . {t("returns.responseTime")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("returns.policyUpdates")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("returns.policyUpdatesBody")}
        </p>
      </section>
    </div>
  );
}
