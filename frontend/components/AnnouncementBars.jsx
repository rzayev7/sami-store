"use client";

import { usePathname } from "next/navigation";
import { useLanguage, stripLocale } from "../context/LanguageContext";

export default function AnnouncementBars() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const cleanPath = stripLocale(pathname);

  if (cleanPath === "/") {
    return null;
  }

  return (
    <div className="w-full bg-[var(--color-green)] py-2 text-center text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--color-gold-soft)]">
      {t("announcement.freeShipping")}
    </div>
  );
}
