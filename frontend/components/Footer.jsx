"use client";

import Link from "./LocaleLink";
import StoreLocations from "./StoreLocations";
import { useLanguage } from "../context/LanguageContext";

function PaymentIcons() {
  const iconClass =
    "h-7 w-11 rounded border border-black/10 bg-white/75 px-1.5 py-1 text-black/50 transition-opacity hover:opacity-90";

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className={iconClass} aria-label="Visa" title="Visa">
        <svg viewBox="0 0 64 24" className="h-full w-full" fill="currentColor" aria-hidden>
          <path d="M24.7 17.2h-3.4L23.4 6.8h3.4l-2.1 10.4Zm14.2-10.1a8.3 8.3 0 0 0-3-.5c-3.3 0-5.6 1.7-5.6 4.2 0 1.8 1.7 2.8 2.9 3.3 1.3.6 1.8 1 1.8 1.5 0 .8-1 .1-2.6.1-1.3 0-2.3-.2-3-.5l-.4-.2-.4 2.6a10.7 10.7 0 0 0 3.6.7c3.5 0 5.8-1.7 5.8-4.4 0-1.4-.9-2.5-2.8-3.3-1.2-.6-2-.9-2-1.5 0-.5.6-1 2-.1 1.1 0 1.9.2 2.5.4l.3.1.4-2.5ZM47.9 6.8h-2.6c-.8 0-1.4.2-1.7 1.1l-5 9.3h3.5l.7-1.8h4.3l.4 1.8h3.1L47.9 6.8Zm-4.3 6 .2-.4c.4-.8 1-2.1 1-2.1l.2-.5.1.4s.4 1.8.6 2.6h-2.1ZM19.3 6.8l-3.3 7.1-.4-2.1a8 8 0 0 0-3.8-4.7l3 10h3.5l5.2-10.3h-4.2Z" />
          <path d="M13 6.8H7.8l-.1.3c4.1 1 6.8 3.4 7.9 6.6l-1.1-5.7c-.2-.9-.8-1.2-1.5-1.2Z" />
        </svg>
      </span>
      <span className={iconClass} aria-label="Mastercard" title="Mastercard">
        <svg viewBox="0 0 64 24" className="h-full w-full" aria-hidden>
          <circle cx="27" cy="12" r="7" fill="#555" />
          <circle cx="37" cy="12" r="7" fill="#777" />
          <path d="M32 6.2a7 7 0 0 0 0 11.6 7 7 0 0 0 0-11.6Z" fill="#666" />
        </svg>
      </span>
      <span className={iconClass} aria-label="American Express" title="American Express">
        <svg viewBox="0 0 64 24" className="h-full w-full" fill="currentColor" aria-hidden>
          <path d="M8 7h18v10H8V7Zm20 0h28v10H28V7Zm2.4 2.2H32v5.6h-1.6V9.2Zm2.2 0h1.6l1.2 1.8 1.2-1.8h1.6l-2 2.9 2.1 2.7h-1.7l-1.2-1.7-1.2 1.7h-1.6l2.1-2.8-2.1-2.8Zm7.7 0h4.4v1.2h-2.8v1h2.7v1.2h-2.7v1h2.8v1.2h-4.4V9.2Zm5.5 0h1.7l2.2 3.4V9.2h1.6v5.6h-1.7L47.4 11v3.8h-1.6V9.2Z" />
        </svg>
      </span>
    </div>
  );
}

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-10 w-full border-t border-black/10 bg-[#F6F3EF] text-[#1a1a1a] sm:mt-14">
      <div className="mx-auto grid w-full max-w-screen-2xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:gap-10 lg:px-12">
        <div className="lg:col-span-2">
          <Link href="/">
            <h3 className="sami-brand text-4xl leading-none">SAMÍ</h3>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-[#1a1a1a]/75">
            {t("footer.tagline")}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#1a1a1a]/55">
            {t("footer.worldwideShipping")}
          </p>
          <div className="mt-6 max-w-sm">
            <StoreLocations variant="footer" />
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em]">{t("footer.shop")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1a1a]/75">
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">{t("footer.newIn")}</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">{t("footer.sets")}</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">{t("footer.dresses")}</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">{t("footer.tops")}</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">{t("footer.bottoms")}</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">{t("footer.blazers")}</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">{t("footer.sale")}</Link>
            </li>
            <li>
              <Link href="/products" className="transition-opacity hover:opacity-70">{t("footer.allProducts")}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em]">{t("footer.support")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1a1a]/75">
            <li>
              <Link href="/shipping" className="transition-opacity hover:opacity-70">
                {t("footer.shipping")}
              </Link>
            </li>
            <li>
              <Link href="/returns" className="transition-opacity hover:opacity-70">
                {t("footer.returnsPolicy")}
              </Link>
            </li>
            <li>
              <Link href="/track-order" className="transition-opacity hover:opacity-70">{t("footer.trackOrder")}</Link>
            </li>
            <li>
              <Link href="/contact" className="transition-opacity hover:opacity-70">{t("footer.contact")}</Link>
            </li>
            <li>
              <Link href="/contact#our-stores" className="transition-opacity hover:opacity-70">
                {t("stores.title")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.16em]">{t("footer.brand")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1a1a]/75">
            <li>
              <Link href="/about" className="transition-opacity hover:opacity-70">{t("footer.about")}</Link>
            </li>
            <li>
              <Link href="/terms" className="transition-opacity hover:opacity-70">{t("footer.terms")}</Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-opacity hover:opacity-70">{t("footer.privacy")}</Link>
            </li>
          </ul>
          <h4 className="mt-8 text-xs font-semibold uppercase tracking-[0.16em]">{t("footer.social")}</h4>
          <ul className="mt-4 space-y-2 text-sm text-[#1a1a1a]/75">
            <li>
              <a
                href="https://www.instagram.com/sami_boutique_baku/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
              >
                <svg
                  width="14"
                  height="14"
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
                {t("footer.instagram")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-black/10 px-4 py-4 sm:px-6 lg:px-12">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#1a1a1a]/45">
            {t("footer.paymentsAccepted")}
          </p>
          <PaymentIcons />
        </div>
      </div>

      <div className="border-t border-black/10 px-4 py-4 text-center text-[11px] uppercase tracking-[0.14em] text-[#1a1a1a]/55 sm:px-6 lg:px-12">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
