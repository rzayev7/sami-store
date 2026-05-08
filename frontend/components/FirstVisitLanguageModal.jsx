"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { stripLocale, useLanguage } from "../context/LanguageContext";
import { useCurrency } from "../context/CurrencyContext";

const STORAGE_KEY = "sami_geo_pref_banner_v1";

const ARAB_COUNTRIES = new Set([
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
]);

const EUROZONE_COUNTRIES = new Set([
  "AT",
  "BE",
  "HR",
  "CY",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PT",
  "SK",
  "SI",
  "ES",
]);

const TEXT_BY_LANG = {
  en: {
    title: "Detected location preferences",
    detectedIn: "We detected you are in",
    switchTo: "Switch to",
    keep: "Keep current",
    apply: "Apply",
  },
  ru: {
    title: "Определены настройки по региону",
    detectedIn: "Мы определили вашу страну:",
    switchTo: "Переключить на:",
    keep: "Оставить текущие",
    apply: "Применить",
  },
  ar: {
    title: "تم اكتشاف تفضيلات المنطقة",
    detectedIn: "تم تحديد موقعك في",
    switchTo: "التحويل إلى",
    keep: "الاحتفاظ بالإعداد الحالي",
    apply: "تطبيق",
  },
  uz: {
    title: "Hudud bo'yicha sozlamalar aniqlandi",
    detectedIn: "Sizning mamlakatingiz aniqlandi:",
    switchTo: "O'tkazish:",
    keep: "Joriy sozlamani qoldirish",
    apply: "Qo'llash",
  },
};

function mapCountryToPreference(countryCode) {
  const cc = String(countryCode || "").toUpperCase();

  if (cc === "UZ") {
    return { language: "uz", currency: "UZS" };
  }
  if (cc === "RU" || cc === "KZ") {
    return { language: "ru", currency: "RUB" };
  }
  if (ARAB_COUNTRIES.has(cc)) {
    return { language: "ar", currency: cc === "SA" ? "SAR" : "AED" };
  }
  if (EUROZONE_COUNTRIES.has(cc)) {
    return { language: "en", currency: "EUR" };
  }
  return { language: "en", currency: "USD" };
}

function isAdminPath(pathname) {
  return Boolean(pathname?.startsWith("/admin"));
}

export default function FirstVisitLanguageModal() {
  const pathname = usePathname();
  const cleanPath = stripLocale(pathname || "");
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  const [bannerOpen, setBannerOpen] = useState(false);
  const [detectedCountryName, setDetectedCountryName] = useState("");
  const [suggested, setSuggested] = useState(null);

  const uiText = useMemo(() => TEXT_BY_LANG[language] || TEXT_BY_LANG.en, [language]);

  useEffect(() => {
    if (!pathname || isAdminPath(cleanPath)) return;
    if (typeof window === "undefined") return;

    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("https://ipapi.co/json/", { credentials: "omit" });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;

        const countryCode = String(data?.country_code || "").toUpperCase();
        const countryName = String(data?.country_name || "").trim();
        if (!countryCode) return;

        const mapped = mapCountryToPreference(countryCode);
        const differs =
          mapped.language !== String(language || "en").toLowerCase() ||
          mapped.currency !== String(currency || "USD").toUpperCase();

        if (!differs) return;

        setDetectedCountryName(countryName || countryCode);
        setSuggested(mapped);
        setBannerOpen(true);
      } catch {
        // ignore geo errors
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, cleanPath, language, currency]);

  const dismissBanner = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    }
    setBannerOpen(false);
  };

  const applySuggestion = () => {
    if (!suggested) return;
    setCurrency(suggested.currency);
    setLanguage(suggested.language);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "applied");
    }
    setBannerOpen(false);
  };

  if (!bannerOpen || !suggested || isAdminPath(cleanPath)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[120] w-[min(92vw,390px)] rounded-lg border border-black/10 bg-white/95 p-4 shadow-xl backdrop-blur">
      <button
        type="button"
        onClick={dismissBanner}
        aria-label="Close"
        className="absolute right-2 top-2 rounded p-1 text-black/35 transition-colors hover:text-black/60"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">
        {uiText.title}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-black/70">
        {uiText.detectedIn}{" "}
        <span className="font-medium text-black/85">{detectedCountryName}</span>. {uiText.switchTo}{" "}
        <span className="font-semibold text-black">
          {String(suggested.language).toUpperCase()} / {suggested.currency}
        </span>
        ?
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={dismissBanner}
          className="rounded-md border border-black/15 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-black/55 transition-colors hover:bg-black/[0.03] hover:text-black/75"
        >
          {uiText.keep}
        </button>
        <button
          type="button"
          onClick={applySuggestion}
          className="rounded-md border border-black bg-black px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
        >
          {uiText.apply}
        </button>
      </div>
    </div>
  );
}
