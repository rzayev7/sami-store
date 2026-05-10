"use client";

import Link from "./LocaleLink";
import StoreLocations from "./StoreLocations";
import { useLanguage } from "../context/LanguageContext";

function PaymentIcons() {
  return (
    <div
      className="mt-3 inline-flex items-center gap-4 rounded-md border border-[var(--color-line)] bg-white/70 px-4 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur-[2px]"
      role="group"
      aria-label="Accepted cards"
    >
      <div className="flex h-7 items-center">
        <img
          src="/Visa_Inc._logo_(2005–2014).svg"
          alt="Visa accepted"
          className="h-5 w-auto object-contain sm:h-6"
          loading="lazy"
          decoding="async"
        />
      </div>
      <span className="h-5 w-px bg-[var(--color-line)]" aria-hidden />
      <div className="flex h-7 items-center">
        <img
          src="/Mastercard-logo.svg.webp"
          alt="Mastercard accepted"
          className="h-6 w-auto object-contain sm:h-7"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

const linkClass =
  "text-sm text-[var(--color-black)]/78 transition-colors duration-200 hover:text-[var(--color-black)]";

const footHeadingClass =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative mt-12 w-full text-[var(--color-black)] sm:mt-16">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/35 to-transparent"
        aria-hidden
      />

      <div className="border-t border-[var(--color-line)] bg-[var(--color-cream)]">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-12 sm:px-6 sm:py-14 lg:px-12 lg:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-12">
            <div className="lg:col-span-5">
              <Link href="/" className="group inline-block transition-opacity hover:opacity-85">
                <h3 className="sami-brand text-4xl leading-none text-[var(--color-gold)] transition-colors duration-300 group-hover:text-[var(--color-gold-soft)]">
                  SAMÍ
                </h3>
              </Link>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[var(--color-black)]/72">
                {t("footer.tagline")}
              </p>
              <p className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-green)]"
                  aria-hidden
                />
                {t("footer.worldwideShipping")}
              </p>
              <div className="mt-8 max-w-md border-t border-[var(--color-line)] pt-8">
                <StoreLocations variant="footer" />
              </div>
              <div className="mt-8">
                <p className={footHeadingClass}>{t("footer.paymentsAccepted")}</p>
                <PaymentIcons />
              </div>
            </div>

            {/* Mobile / tablet: Shop | Support in two columns; lg: flow into main 12-col row */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8 lg:contents">
              <nav aria-labelledby="footer-shop-heading" className="min-w-0 lg:col-span-2">
                <h4 id="footer-shop-heading" className={footHeadingClass}>
                  {t("footer.shop")}
                </h4>
                <ul className="mt-5 flex flex-col gap-2.5">
                  <li>
                    <Link href="/products" className={linkClass}>
                      {t("footer.newIn")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={linkClass}>
                      {t("footer.sets")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={linkClass}>
                      {t("footer.dresses")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={linkClass}>
                      {t("footer.tops")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={linkClass}>
                      {t("footer.bottoms")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={linkClass}>
                      {t("footer.blazers")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={linkClass}>
                      {t("footer.sale")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={linkClass}>
                      {t("footer.allProducts")}
                    </Link>
                  </li>
                </ul>
              </nav>

              <nav aria-labelledby="footer-support-heading" className="min-w-0 lg:col-span-2">
                <h4 id="footer-support-heading" className={footHeadingClass}>
                  {t("footer.support")}
                </h4>
                <ul className="mt-5 flex flex-col gap-2.5">
                  <li>
                    <Link href="/shipping" className={linkClass}>
                      {t("footer.shipping")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/returns" className={linkClass}>
                      {t("footer.returnsPolicy")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/track-order" className={linkClass}>
                      {t("footer.trackOrder")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className={linkClass}>
                      {t("footer.contact")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact#our-stores" className={linkClass}>
                      {t("stores.title")}
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Mobile: Brand links | Social side by side; lg: single stacked column */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 lg:col-span-3 lg:flex lg:flex-col lg:gap-10">
              <nav aria-labelledby="footer-brand-heading" className="min-w-0">
                <h4 id="footer-brand-heading" className={footHeadingClass}>
                  {t("footer.brand")}
                </h4>
                <ul className="mt-5 flex flex-col gap-2.5">
                  <li>
                    <Link href="/about" className={linkClass}>
                      {t("footer.about")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className={linkClass}>
                      {t("footer.terms")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className={linkClass}>
                      {t("footer.privacy")}
                    </Link>
                  </li>
                </ul>
              </nav>

              <div className="min-w-0 lg:mt-0">
                <h4 className={footHeadingClass}>{t("footer.social")}</h4>
                <ul className="mt-4">
                  <li>
                    <a
                      href="https://www.instagram.com/sami_boutique_baku/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full max-w-full items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/50 px-3 py-2 text-[13px] leading-snug text-[var(--color-black)]/85 shadow-[var(--shadow-soft)] transition-all duration-200 hover:border-[var(--color-gold)]/50 hover:bg-white hover:text-[var(--color-black)] sm:gap-3 sm:px-4 sm:py-2.5 sm:text-sm"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-black)]/5 sm:h-8 sm:w-8">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                        </svg>
                      </span>
                      <span className="min-w-0 break-words">{t("footer.instagram")}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-line)] bg-[var(--color-sand)]/35 px-4 py-5 sm:px-6 lg:px-12">
        <p className="mx-auto max-w-screen-2xl text-center text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
