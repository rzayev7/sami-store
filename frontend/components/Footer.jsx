"use client";

import Link from "./LocaleLink";
import { SUPPORT_EMAIL } from "../lib/sitePublic";
import { useLanguage } from "../context/LanguageContext";

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
                className="transition-opacity hover:opacity-70"
              >
                {t("footer.instagram")}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-black/10 px-4 py-4 text-center text-[11px] uppercase tracking-[0.14em] text-[#1a1a1a]/55 sm:px-6 lg:px-12">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
