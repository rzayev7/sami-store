"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import { LANGUAGES } from "../i18n";

const STORAGE_KEY = "userLanguagePreference";
const MODAL_LANG_CODES = ["en", "ar", "az", "fr", "ru", "tr", "uz", "kk"];

const FLAG_BY_CODE = {
  en: "🇬🇧",
  ar: "🇸🇦",
  az: "🇦🇿",
  fr: "🇫🇷",
  ru: "🇷🇺",
  tr: "🇹🇷",
  uz: "🇺🇿",
  kk: "🇰🇿",
};

function countryToSuggestedLang(countryCode) {
  if (!countryCode || typeof countryCode !== "string") return "en";
  const c = countryCode.toUpperCase();
  if (c === "TR") return "tr";
  if (c === "UZ") return "uz";
  if (c === "KZ") return "kk";
  if (c === "RU") return "ru";
  if (c === "SA" || c === "AE" || c === "EG" || c === "MA") return "ar";
  if (c === "AZ") return "az";
  if (c === "FR") return "fr";
  return "en";
}

/** Locale prefix from URL (middleware already routes /uz/... etc.). */
function modalLangFromPath(pathname) {
  if (!pathname) return null;
  const first = pathname.split("/")[1];
  return MODAL_LANG_CODES.includes(first) ? first : null;
}

function isAdminPath(pathname) {
  return Boolean(pathname?.startsWith("/admin"));
}

function getCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

/** True when URL shows an explicit non-default locale (/tr, /uz, …) — not middleware’s usual /en/… */
function isExplicitNonEnglishPath(pathLang) {
  return pathLang != null && pathLang !== "en";
}

export default function FirstVisitLanguageModal() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const { setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("en");
  const userChangedSelection = useRef(false);
  /** Set only after ipapi request finishes (success or error) while still mounted — not at "fetch started".
   *  Avoids React Strict Mode dev double-invoke: first effect's cleanup cancels the request but must not
   *  block the second effect from running geo (the old geoFetchStartedRef caused that bug → stuck on English). */
  const geoSettledRef = useRef(false);

  // (3) Latest path for async geo callback if user navigates mid-request
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const options = useMemo(
    () =>
      MODAL_LANG_CODES.map((code) => LANGUAGES.find((l) => l.code === code)).filter(
        Boolean,
      ),
    [],
  );

  useEffect(() => {
    if (!pathname) return;

    if (isAdminPath(pathname)) {
      setOpen(false);
      return;
    }

    try {
      const cookieLang = getCookie("sami_lang");
      if (MODAL_LANG_CODES.includes(cookieLang)) {
        window.localStorage.setItem(STORAGE_KEY, cookieLang);
        setOpen(false);
        return;
      }
      if (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(false);
        return;
      }
    } catch {
      return;
    }

    setOpen(true);
    const pathLang = modalLangFromPath(pathname);
    if (isExplicitNonEnglishPath(pathLang) && !userChangedSelection.current) {
      setSelected(pathLang);
    }

    // (1) One completed geo lookup per page session; re-run only if never settled (e.g. Strict Mode remount)
    if (geoSettledRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { credentials: "omit" });
        if (!res.ok) throw new Error("geo");
        const data = await res.json();
        if (data && typeof data === "object" && data.error) throw new Error("geo");
        if (cancelled || userChangedSelection.current) return;
        const latestPathLang = modalLangFromPath(pathnameRef.current);
        // (2) Respect explicit /tr, /uz, … — do not override with geo
        if (isExplicitNonEnglishPath(latestPathLang)) {
          geoSettledRef.current = true;
          return;
        }
        const suggested = countryToSuggestedLang(data?.country_code);
        if (MODAL_LANG_CODES.includes(suggested)) setSelected(suggested);
        else setSelected("en");
        geoSettledRef.current = true;
      } catch {
        // (4) ipapi failed: path locale if not en, else en
        if (cancelled || userChangedSelection.current) return;
        const latestPathLang = modalLangFromPath(pathnameRef.current);
        if (isExplicitNonEnglishPath(latestPathLang)) {
          if (!userChangedSelection.current) setSelected(latestPathLang);
          geoSettledRef.current = true;
          return;
        }
        if (!userChangedSelection.current) setSelected("en");
        geoSettledRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleContinue = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, selected);
    } catch {
      /* ignore quota / private mode */
    }
    // Applies locale routing + cookie (equivalent to i18n.changeLanguage in this app).
    setLanguage(selected);
    if (selected === "ar") {
      document.documentElement.dir = "rtl";
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-visit-lang-title"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--color-black)]/10 bg-[var(--color-cream)] p-6 shadow-lg">
        <h2
          id="first-visit-lang-title"
          className="font-[family-name:var(--font-brand)] text-lg tracking-wide text-[var(--color-black)] sm:text-xl"
        >
          Choose your language
        </h2>
        <p className="mt-2 text-sm text-[var(--color-black)]/70">
          Select a language to continue browsing.
        </p>
        <ul className="mt-6 max-h-[min(50vh,22rem)] space-y-2 overflow-y-auto pr-1">
          {options.map((lang) => {
            const code = lang.code;
            const flag = FLAG_BY_CODE[code] ?? "";
            const checked = selected === code;
            return (
              <li key={code}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                    checked
                      ? "border-[var(--color-black)] bg-[var(--color-black)]/[0.06]"
                      : "border-[var(--color-black)]/15 hover:border-[var(--color-black)]/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="first-visit-lang"
                    value={code}
                    checked={checked}
                    onChange={() => {
                      userChangedSelection.current = true;
                      setSelected(code);
                    }}
                    className="h-4 w-4 shrink-0 accent-[var(--color-black)]"
                  />
                  <span className="text-2xl leading-none" aria-hidden>
                    {flag}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-black)]">{lang.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={handleContinue}
          className="mt-6 w-full rounded-md border border-[var(--color-black)] bg-[var(--color-black)] px-4 py-3 text-sm font-medium uppercase tracking-wider text-[var(--color-cream)] transition-opacity hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
