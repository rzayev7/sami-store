"use client";

import en from "./en.json";
import ar from "./ar.json";
import ru from "./ru.json";
import uz from "./uz.json";
import fr from "./fr.json";

export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "uz", label: "Oʻzbekcha", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
];

const dictionaries = { en, ar, ru, uz, fr };

function resolve(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

export function translate(lang, key, params) {
  const dict = dictionaries[lang] || dictionaries.en;
  let value = resolve(dict, key) ?? resolve(dictionaries.en, key) ?? key;

  if (typeof value !== "string") return key;
  if (!params) return value;

  return Object.entries(params).reduce(
    (str, [k, v]) => str.replaceAll(`{${k}}`, String(v ?? "")),
    value,
  );
}

export function getDirection(lang) {
  return LANGUAGES.find((l) => l.code === lang)?.dir || "ltr";
}

export const DEFAULT_LANG = "en";
