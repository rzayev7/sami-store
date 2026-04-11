"use client";

import { useLanguage } from "../context/LanguageContext";

/**
 * @param {{ variant?: "page" | "footer" }} props
 */
export default function StoreLocations({ variant = "page" }) {
  const { t } = useLanguage();
  const isFooter = variant === "footer";

  const sectionId = isFooter ? undefined : "our-stores";
  const headingId = isFooter ? "our-stores-footer-heading" : "our-stores-heading";

  return (
    <section
      id={sectionId}
      aria-labelledby={headingId}
      className={isFooter ? "" : "mt-8 max-w-sm"}
    >
      <h2
        id={headingId}
        className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]"
      >
        {t("stores.title")}
      </h2>

      <ul className="mt-4 space-y-4">
        <li>
          <article>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1a1a1a]/50">
              {t("stores.may28")}
            </h3>
            <address className="not-italic mt-1 text-sm leading-[1.65] text-[#1a1a1a]/75">
              {t("stores.may28Address")}
            </address>
          </article>
        </li>
      </ul>
    </section>
  );
}
