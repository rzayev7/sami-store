"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_LANG, LANGUAGES, getDirection, translate } from "../i18n";

const LANG_CODES = LANGUAGES.map((l) => l.code);

function langFromPath(pathname) {
  const first = pathname?.split("/")[1];
  return LANG_CODES.includes(first) ? first : null;
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const urlLang = langFromPath(typeof window !== "undefined" ? window.location.pathname : "");
  const [language, setLanguageRaw] = useState(urlLang || DEFAULT_LANG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const browserLang = langFromPath(window.location.pathname);
    if (browserLang && browserLang !== language) {
      setLanguageRaw(browserLang);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const browserLang = langFromPath(window.location.pathname);
    if (browserLang && browserLang !== language) {
      setLanguageRaw(browserLang);
    }
  }, [pathname]);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
  }, [language, hydrated]);

  const setLanguage = useCallback(
    (code) => {
      if (!LANG_CODES.includes(code)) return;
      setLanguageRaw(code);
      document.cookie = `sami_lang=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      const current = window.location.pathname;
      const curLang = langFromPath(current);
      let newPath;
      if (curLang) {
        newPath = "/" + code + current.slice(curLang.length + 1);
      } else {
        newPath = "/" + code + current;
      }
      const search = window.location.search;
      router.push(newPath + search);
    },
    [router],
  );

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, dir: getDirection(language) }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function useLocalePath() {
  const { language } = useLanguage();
  return useCallback(
    (href) => {
      if (!href || !href.startsWith("/")) return href;
      if (langFromPath(href)) return href;
      return `/${language}${href}`;
    },
    [language],
  );
}

export function stripLocale(pathname) {
  if (!pathname) return pathname;
  const first = pathname.split("/")[1];
  if (LANG_CODES.includes(first)) {
    return "/" + pathname.split("/").slice(2).join("/") || "/";
  }
  return pathname;
}
