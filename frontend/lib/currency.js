// Prices in the database are stored in AZN (admin base). Exchange rates update from /api/exchange-rates.
const DEFAULT_AZN_PER_USD = 1.7;

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "AZN", symbol: "₼", name: "Azerbaijani Manat", flag: "🇦🇿" },
];

const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

export function getCurrencyInfo(code) {
  return CURRENCY_MAP[code] || CURRENCY_MAP.USD;
}

/**
 * @param {number} amountAZN - price in Azerbaijani Manat (base currency)
 * @param {string} currencyCode - USD | EUR | AED | AZN
 * @param {object} rates - per 1 USD from open.er-api (EUR, AED, …)
 * @param {number} aznPerUsd - AZN per 1 USD
 */
export function formatPrice(amountAZN, currencyCode = "USD", rates = {}, aznPerUsd = DEFAULT_AZN_PER_USD) {
  if (amountAZN == null || isNaN(amountAZN)) return "";

  const n = Number(amountAZN);
  const amountUSD = n / aznPerUsd;

  if (currencyCode === "AZN") {
    return `₼${n.toFixed(2)}`;
  }

  if (currencyCode === "USD") {
    return `$${amountUSD.toFixed(2)}`;
  }

  const rate = rates[currencyCode];
  if (rate == null || isNaN(rate)) {
    return `$${amountUSD.toFixed(2)}`;
  }

  const converted = amountUSD * rate;

  if (currencyCode === "EUR") {
    return `€${converted.toFixed(2)}`;
  }

  if (currencyCode === "AED") {
    return `AED ${converted.toFixed(2)}`;
  }

  return `$${amountUSD.toFixed(2)}`;
}

const LOCALE_TO_CURRENCY = {
  az: "AZN",
  "az-AZ": "AZN",
  "en-AZ": "AZN",
  ar: "AED",
  "ar-AE": "AED",
  de: "EUR",
  fr: "EUR",
  it: "EUR",
  es: "EUR",
  nl: "EUR",
  pt: "EUR",
};

export function detectCurrency() {
  if (typeof navigator === "undefined") return "USD";
  const lang = navigator.language || "";
  if (LOCALE_TO_CURRENCY[lang]) return LOCALE_TO_CURRENCY[lang];
  const prefix = lang.split("-")[0];
  return LOCALE_TO_CURRENCY[prefix] || "USD";
}
