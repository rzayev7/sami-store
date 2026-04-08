"use client";

import Link from "../../components/LocaleLink";
import { useLanguage } from "../../context/LanguageContext";

export default function ShippingPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          {t("common.home")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">{t("shipping.title")}</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        {t("shipping.title")}
      </h1>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("shipping.worldwideDelivery")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("shipping.worldwideBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("shipping.deliveryTimes")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("shipping.deliveryBody1")}
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("shipping.deliveryBody2")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("shipping.orderTracking")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("shipping.orderTrackingBody")}{" "}
          <Link
            href="/track-order"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {t("shipping.trackOrderLink")}
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("shipping.returns")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("shipping.returnsBody")}{" "}
          <Link
            href="/returns"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {t("shipping.returnsPolicyLink")}
          </Link>{" "}
          {t("shipping.returnsBodyEnd")}
        </p>
      </section>
    </div>
  );
}
