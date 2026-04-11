// Store prices are kept in a fixed base unit; we convert via AZN-per-USD from the API, then to display currency.
const DEFAULT_AZN_PER_USD = 1.7;

/**
 * @typedef {{ code: string, symbol: string, name: string, flag: string, decimals?: number }} CurrencyDef
 */

/** @type {CurrencyDef[]} */
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "United States", flag: "🇺🇸", decimals: 2 },
  { code: "AZN", symbol: "₼", name: "Azerbaijan", flag: "🇦🇿", decimals: 2 },
  { code: "EUR", symbol: "€", name: "Eurozone", flag: "🇪🇺", decimals: 2 },
  { code: "TRY", symbol: "₺", name: "Türkiye", flag: "🇹🇷", decimals: 2 },
  { code: "AED", symbol: "AED", name: "United Arab Emirates", flag: "🇦🇪", decimals: 2 },
  { code: "SAR", symbol: "SAR", name: "Saudi Arabia", flag: "🇸🇦", decimals: 2 },
  { code: "KZT", symbol: "₸", name: "Kazakhstan", flag: "🇰🇿", decimals: 2 },
  { code: "UZS", symbol: "soʻm ", name: "Uzbekistan", flag: "🇺🇿", decimals: 2 },
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

  if (currencyCode === "AZN") {
    return `₼${n.toFixed(2)}`;
  }

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

  if (currencyCode === "AED") {
    return `AED ${converted.toFixed(dec)}`;
  }
  if (currencyCode === "SAR") {
    return `SAR ${converted.toFixed(dec)}`;
  }

  const sym = info.symbol;
  return `${sym}${converted.toFixed(dec)}`;
}

const LOCALE_TO_CURRENCY = {
  "az-AZ": "AZN",
  az: "AZN",
  "ar-SA": "SAR",
  "ar-AE": "AED",
  "tr-TR": "TRY",
  "kk-KZ": "KZT",
  "uz-UZ": "UZS",
  ar: "AED",
  de: "EUR",
  fr: "EUR",
  it: "EUR",
  es: "EUR",
  nl: "EUR",
  pt: "EUR",
  kk: "KZT",
  uz: "UZS",
};

export function detectCurrency() {
  if (typeof navigator === "undefined") return "USD";
  const lang = navigator.language || "";
  if (LOCALE_TO_CURRENCY[lang]) return LOCALE_TO_CURRENCY[lang];
  const prefix = lang.split("-")[0];
  return LOCALE_TO_CURRENCY[prefix] || "USD";
}
