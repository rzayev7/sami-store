"use client";

import Link from "../../components/LocaleLink";
import StoreLocations from "../../components/StoreLocations";
import { SUPPORT_EMAIL } from "../../lib/sitePublic";
import { useLanguage } from "../../context/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          {t("common.home")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">{t("contact.title")}</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        {t("contact.title")}
      </h1>

      <p className="mt-8 text-[15px] leading-[1.85] text-black/70">
        {t("contact.intro")}
      </p>

      <StoreLocations variant="page" />

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("contact.emailSection")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("contact.responseTime")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("contact.whatsapp")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("contact.whatsappBody")}
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          <a
            href="https://wa.me/994554737996"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            +994 55 473 79 96
          </a>
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("contact.socialMedia")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("contact.followUs")}{" "}
          <a
            href="https://www.instagram.com/sami_boutique_baku/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            Instagram
          </a>{" "}
          {t("contact.instagramSuffix")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("contact.businessInquiries")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("contact.businessBody")}
        </p>
      </section>
    </div>
  );
}
