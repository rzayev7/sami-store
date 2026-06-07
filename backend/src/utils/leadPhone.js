/** Longest-prefix match for common calling codes in our audience. */
const CALLING_CODES = [
  ["998", "Uzbekistan"],
  ["996", "Kyrgyzstan"],
  ["995", "Georgia"],
  ["994", "Azerbaijan"],
  ["993", "Turkmenistan"],
  ["992", "Tajikistan"],
  ["971", "UAE"],
  ["966", "Saudi Arabia"],
  ["962", "Jordan"],
  ["961", "Lebanon"],
  ["974", "Qatar"],
  ["973", "Bahrain"],
  ["965", "Kuwait"],
  ["964", "Iraq"],
  ["963", "Syria"],
  ["962", "Jordan"],
  ["380", "Ukraine"],
  ["375", "Belarus"],
  ["373", "Moldova"],
  ["370", "Lithuania"],
  ["371", "Latvia"],
  ["372", "Estonia"],
  ["359", "Bulgaria"],
  ["351", "Portugal"],
  ["212", "Morocco"],
  ["213", "Algeria"],
  ["216", "Tunisia"],
  ["218", "Libya"],
  ["234", "Nigeria"],
  ["254", "Kenya"],
  ["90", "Turkey"],
  ["49", "Germany"],
  ["44", "United Kingdom"],
  ["39", "Italy"],
  ["34", "Spain"],
  ["33", "France"],
  ["7", "Russia / Kazakhstan"],
  ["1", "USA / Canada"],
];

const SORTED_CODES = [...CALLING_CODES].sort((a, b) => b[0].length - a[0].length);

const COUNTRY_NAMES = {
  AZ: "Azerbaijan",
  UZ: "Uzbekistan",
  RU: "Russia",
  KZ: "Kazakhstan",
  SA: "Saudi Arabia",
  MA: "Morocco",
  AE: "UAE",
  US: "USA",
  GB: "United Kingdom",
  TR: "Turkey",
  DE: "Germany",
  FR: "France",
  AR: "Argentina",
};

function detectCountryFromDigits(digits) {
  if (!digits) return "";
  for (const [code, name] of SORTED_CODES) {
    if (digits.startsWith(code)) return name;
  }
  return "";
}

function looksLikeSpamDigits(digits) {
  if (!digits || digits.length < 8) return true;
  const leadingZeros = digits.match(/^0*/)?.[0]?.length ?? 0;
  if (leadingZeros >= 3) return true;
  const unique = new Set(digits.split(""));
  if (unique.size <= 2) return true;
  if (/^0+$/.test(digits)) return true;
  return false;
}

function isPlausibleInternational(digits) {
  const country = detectCountryFromDigits(digits);
  if (!country) return false;
  // "7" and "1" match too many partial local numbers — require full length.
  if (digits.startsWith("7") && digits.length !== 11) return false;
  if (digits.startsWith("1") && digits.length !== 11) return false;
  return true;
}

/**
 * Normalize a WhatsApp / phone string to E.164 (+digits).
 * Returns { valid, e164, digits, countryFromPhone }.
 */
function normalizeLeadPhone(raw) {
  const empty = { valid: false, e164: "", digits: "", countryFromPhone: "" };
  let input = String(raw || "").trim();
  if (!input) return empty;

  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);

  // RU/KZ local: 8XXXXXXXXXX → 7XXXXXXXXXX
  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }

  if (!/^\d+$/.test(digits)) return empty;
  if (digits.length < 8 || digits.length > 15) return empty;
  if (looksLikeSpamDigits(digits)) return empty;
  if (!isPlausibleInternational(digits)) return empty;

  return {
    valid: true,
    e164: `+${digits}`,
    digits,
    countryFromPhone: detectCountryFromDigits(digits),
  };
}

/** ISO country from reverse-proxy headers (Vercel, Cloudflare, etc.). */
function countryFromRequest(req) {
  const iso =
    req.headers["cf-ipcountry"] ||
    req.headers["x-vercel-ip-country"] ||
    req.headers["cloudfront-viewer-country"] ||
    "";

  const code = String(iso).trim().toUpperCase();
  if (!code || code === "XX" || code === "T1") return "";
  return COUNTRY_NAMES[code] || code;
}

function resolveLeadCountry({ phoneCountry, reqCountry }) {
  return phoneCountry || reqCountry || "";
}

module.exports = {
  normalizeLeadPhone,
  countryFromRequest,
  resolveLeadCountry,
  detectCountryFromDigits,
};
