"use client";

import Link from "../../components/LocaleLink";
import { SUPPORT_EMAIL } from "../../lib/sitePublic";
import { useLanguage } from "../../context/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          {t("common.home")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">{t("privacy.title")}</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        {t("privacy.title")}
      </h1>

      <p className="mt-8 text-[15px] leading-[1.85] text-black/70">
        {t("privacy.intro")}
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.infoCollect")}
        </h2>
        <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-[1.85] text-black/70">
          <li>
            <strong>{t("privacy.accountInfo")}</strong> — {t("privacy.accountInfoDesc")}
          </li>
          <li>
            <strong>{t("privacy.orderInfo")}</strong> — {t("privacy.orderInfoDesc")}
          </li>
          <li>
            <strong>{t("privacy.usageData")}</strong> — {t("privacy.usageDataDesc")}
          </li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.howWeUse")}
        </h2>
        <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-[1.85] text-black/70">
          <li>{t("privacy.use1")}</li>
          <li>{t("privacy.use2")}</li>
          <li>{t("privacy.use3")}</li>
          <li>{t("privacy.use4")}</li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.dataSharing")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.dataSharingBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.legalBasis")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.legalBasisIntro")}
        </p>
        <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-[1.85] text-black/70">
          <li>
            <strong>{t("privacy.contract")}</strong> — {t("privacy.contractDesc")}
          </li>
          <li>
            <strong>{t("privacy.consent")}</strong> — {t("privacy.consentDesc")}
          </li>
          <li>
            <strong>{t("privacy.legitimateInterest")}</strong> — {t("privacy.legitimateInterestDesc")}
          </li>
        </ul>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.withdrawConsent")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.cookies")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.cookiesBody1")}
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.cookiesBody2")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.dataRetention")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.dataRetentionIntro")}
        </p>
        <ul className="list-disc space-y-1.5 ps-5 text-[15px] leading-[1.85] text-black/70">
          <li>
            <strong>{t("privacy.accountRetention")}</strong> — {t("privacy.accountRetentionDesc")}
          </li>
          <li>
            <strong>{t("privacy.orderRetention")}</strong> — {t("privacy.orderRetentionDesc")}
          </li>
          <li>
            <strong>{t("privacy.usageRetention")}</strong> — {t("privacy.usageRetentionDesc")}
          </li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.dataSecurity")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.dataSecurityBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.yourRights")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.yourRightsBody")}
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          {t("privacy.contact")}
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          {t("privacy.contactBody")}{" "}
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
