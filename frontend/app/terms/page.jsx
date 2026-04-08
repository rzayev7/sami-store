"use client";

import Link from "../../components/LocaleLink";
import { SUPPORT_EMAIL } from "../../lib/sitePublic";
import { useLanguage } from "../../context/LanguageContext";

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          {t("common.home")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">{t("terms.title")}</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        {t("terms.title")}
      </h1>

      <p className="mt-8 text-[15px] leading-[1.85] text-black/70">
        {t("terms.intro")}
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.ordersPricing")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.ordersPricingBody")}
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.orderAcceptance")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.payment")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.paymentBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.salesReturns")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.salesReturnsBody")}{" "}
          <Link
            href="/returns"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {t("terms.salesReturnsLink")}
          </Link>{" "}
          {t("terms.salesReturnsEnd")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.shippingSection")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.shippingBody")}{" "}
          <Link
            href="/shipping"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {t("terms.shippingLink")}
          </Link>{" "}
          {t("terms.shippingEnd")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.accuracy")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.accuracyBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.ip")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.ipBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.liability")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.liabilityBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.changes")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.changesBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("terms.contact")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("terms.contactBody")}{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
