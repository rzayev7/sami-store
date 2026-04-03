// AZN is the base/admin currency. All prices in the DB are stored in AZN.
// AZN is soft-pegged to USD at ~1.70. This rate is updated from the API when available.
const DEFAULT_AZN_PER_USD = 1.70;

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", flag: "🇷🇺" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", flag: "🇹🇷" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", flag: "🇰🇼" },
];

const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));

export function getCurrencyInfo(code) {
  return CURRENCY_MAP[code] || CURRENCY_MAP.USD;
}

/**
 * Convert a price stored in AZN to the customer's selected currency.
 * @param {number} amountAZN - price in Azerbaijani Manat (base currency)
 * @param {string} currencyCode - target currency code
 * @param {object} rates - { EUR: 0.92, GBP: 0.79, ... } rates per 1 USD
 * @param {number} [aznPerUsd] - how many AZN per 1 USD
 */
export function formatPrice(amountAZN, currencyCode = "USD", rates = {}, aznPerUsd = DEFAULT_AZN_PER_USD) {
  if (amountAZN == null || isNaN(amountAZN)) return "";

  const amountUSD = Number(amountAZN) / aznPerUsd;

  if (currencyCode === "USD") {
    return `$${amountUSD.toFixed(2)}`;
  }

  const rate = rates[currencyCode];
  if (!rate) return `$${amountUSD.toFixed(2)}`;

  const converted = amountUSD * rate;
  const info = getCurrencyInfo(currencyCode);
  const decimals = currencyCode === "KWD" ? 3 : 2;

  return `${info.symbol}${converted.toFixed(decimals)}`;
}

const LOCALE_TO_CURRENCY = {
  ru: "RUB",
  tr: "TRY",
  ar: "AED",
  "ar-SA": "SAR",
  "ar-KW": "KWD",
  "ar-AE": "AED",
  "en-GB": "GBP",
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
