/**
 * Default storefront locale when the visitor has no `sami_lang` cookie yet.
 * Used by middleware (first redirect) and short-link landing pages.
 */

export const SUPPORTED_LOCALES = ["en", "ar", "ru", "uz", "fr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Arabic-speaking / MENA markets → default Arabic storefront. */
export const ARAB_COUNTRY_CODES = new Set([
  "AE",
  "SA",
  "BH",
  "KW",
  "QA",
  "OM",
  "EG",
  "JO",
  "LB",
  "MA",
  "DZ",
  "TN",
  "IQ",
  "LY",
  "SD",
  "YE",
  "PS",
  "SY",
  "MR",
  "DJ",
  "KM",
]);

function normalizeCountry(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toUpperCase();
}

/**
 * Pick best-matching supported locale from Accept-Language (by q-value).
 */
export function localeFromAcceptLanguage(header: string | null | undefined): SupportedLocale | null {
  const raw = String(header || "").trim();
  if (!raw) return null;

  const entries: { code: string; q: number }[] = [];
  for (const part of raw.split(",")) {
    const [langPart, ...params] = part.trim().split(";").map((s) => s.trim());
    if (!langPart) continue;
    const primary = langPart.split("-")[0]?.toLowerCase() || "";
    if (!primary) continue;
    let q = 1;
    for (const p of params) {
      if (p.startsWith("q=")) {
        const n = parseFloat(p.slice(2));
        if (!Number.isNaN(n)) q = n;
      }
    }
    entries.push({ code: primary, q });
  }

  entries.sort((a, b) => b.q - a.q);
  for (const { code } of entries) {
    if (SUPPORTED_LOCALES.includes(code as SupportedLocale)) return code as SupportedLocale;
  }
  return null;
}

/**
 * Infer default locale from country (edge/geo headers) and browser language.
 * Order: geo (Arab / RU+KZ+BY / UZ) → Accept-Language → English.
 */
export function inferDefaultLocaleFromSignals(signals: {
  countryCode: string | null | undefined;
  acceptLanguage: string | null | undefined;
}): SupportedLocale {
  const cc = normalizeCountry(signals.countryCode);

  if (ARAB_COUNTRY_CODES.has(cc)) return "ar";
  if (cc === "UZ") return "uz";
  if (cc === "RU" || cc === "KZ" || cc === "BY") return "ru";
  if (cc === "FR" || cc === "MC" || cc === "LU") return "fr";

  const fromHeader = localeFromAcceptLanguage(signals.acceptLanguage);
  if (fromHeader) return fromHeader;

  return "en";
}
