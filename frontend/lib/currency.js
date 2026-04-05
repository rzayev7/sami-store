// Store prices are kept in a fixed base unit; we convert via AZN-per-USD from the API, then to display currency.
const DEFAULT_AZN_PER_USD = 1.7;

/**
 * @typedef {{ code: string, symbol: string, name: string, flag: string, decimals?: number }} CurrencyDef
 */

/** @type {CurrencyDef[]} */
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "United States", flag: "🇺🇸", decimals: 2 },
  { code: "EUR", symbol: "€", name: "Eurozone", flag: "🇪🇺", decimals: 2 },
  { code: "GBP", symbol: "£", name: "United Kingdom", flag: "🇬🇧", decimals: 2 },
  { code: "CHF", symbol: "CHF", name: "Switzerland", flag: "🇨🇭", decimals: 2 },
  { code: "SEK", symbol: "SEK", name: "Sweden", flag: "🇸🇪", decimals: 2 },
  { code: "NOK", symbol: "NOK", name: "Norway", flag: "🇳🇴", decimals: 2 },
  { code: "PLN", symbol: "zł", name: "Poland", flag: "🇵🇱", decimals: 2 },
  { code: "TRY", symbol: "₺", name: "Türkiye", flag: "🇹🇷", decimals: 2 },
  { code: "AED", symbol: "AED", name: "United Arab Emirates", flag: "🇦🇪", decimals: 2 },
  { code: "SAR", symbol: "SAR", name: "Saudi Arabia", flag: "🇸🇦", decimals: 2 },
  { code: "CAD", symbol: "C$", name: "Canada", flag: "🇨🇦", decimals: 2 },
  { code: "AUD", symbol: "A$", name: "Australia", flag: "🇦🇺", decimals: 2 },
  { code: "JPY", symbol: "¥", name: "Japan", flag: "🇯🇵", decimals: 0 },
  { code: "INR", symbol: "₹", name: "India", flag: "🇮🇳", decimals: 2 },
  { code: "BRL", symbol: "R$", name: "Brazil", flag: "🇧🇷", decimals: 2 },
];

const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

export function getCurrencyInfo(code) {
  return CURRENCY_MAP[code] || CURRENCY_MAP.USD;
}

/**
 * @param {number} amountAZN - stored amount in base units (same pipeline as before)
 * @param {string} currencyCode
 * @param {object} rates - per 1 USD from open.er-api
 * @param {number} aznPerUsd - AZN per 1 USD (internal conversion only)
 */
export function formatPrice(amountAZN, currencyCode = "USD", rates = {}, aznPerUsd = DEFAULT_AZN_PER_USD) {
  if (amountAZN == null || isNaN(amountAZN)) return "";

  const n = Number(amountAZN);
  const amountUSD = n / aznPerUsd;

  if (currencyCode === "USD") {
    return `$${amountUSD.toFixed(2)}`;
  }

  const info = getCurrencyInfo(currencyCode);
  const rate = rates[currencyCode];
  if (rate == null || isNaN(rate)) {
    return `$${amountUSD.toFixed(2)}`;
  }

  const converted = amountUSD * rate;
  const dec = info.decimals ?? 2;

  if (currencyCode === "JPY") {
    return `¥${Math.round(converted).toLocaleString("en-US")}`;
  }

  if (currencyCode === "AED") {
    return `AED ${converted.toFixed(dec)}`;
  }
  if (currencyCode === "SAR") {
    return `SAR ${converted.toFixed(dec)}`;
  }
  if (currencyCode === "CHF") {
    return `CHF ${converted.toFixed(dec)}`;
  }

  if (currencyCode === "SEK") {
    return `${converted.toFixed(dec)} SEK`;
  }
  if (currencyCode === "NOK") {
    return `${converted.toFixed(dec)} NOK`;
  }

  if (currencyCode === "PLN") {
    return `${converted.toFixed(dec).replace(".", ",")} zł`;
  }

  const sym = info.symbol;
  return `${sym}${converted.toFixed(dec)}`;
}

const LOCALE_TO_CURRENCY = {
  "en-GB": "GBP",
  "en-AU": "AUD",
  "en-CA": "CAD",
  "en-IN": "INR",
  "ja-JP": "JPY",
  "pt-BR": "BRL",
  "ar-SA": "SAR",
  "ar-AE": "AED",
  "tr-TR": "TRY",
  "de-CH": "CHF",
  "fr-CH": "CHF",
  "it-CH": "CHF",
  "sv-SE": "SEK",
  "nb-NO": "NOK",
  "nn-NO": "NOK",
  "pl-PL": "PLN",
  ar: "AED",
  de: "EUR",
  fr: "EUR",
  it: "EUR",
  es: "EUR",
  nl: "EUR",
  pt: "EUR",
  sv: "SEK",
};

export function detectCurrency() {
  if (typeof navigator === "undefined") return "USD";
  const lang = navigator.language || "";
  if (LOCALE_TO_CURRENCY[lang]) return LOCALE_TO_CURRENCY[lang];
  const prefix = lang.split("-")[0];
  return LOCALE_TO_CURRENCY[prefix] || "USD";
}
