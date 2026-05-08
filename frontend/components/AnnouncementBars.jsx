"use client";

import { usePathname } from "next/navigation";
import { stripLocale } from "../context/LanguageContext";
import { useLanguage } from "../context/LanguageContext";

export default function AnnouncementBars() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const cleanPath = stripLocale(pathname);

  // Keep the home hero clean and premium.
  if (cleanPath === "/") {
    return null;
  }

  return (
    <div className="w-full border-y border-black/10 bg-[var(--color-green)]">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-center px-4 py-2.5 sm:px-6 lg:px-12">
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[12px] font-medium tracking-[0.01em] text-[var(--color-gold-soft)] sm:text-[13px]">
          <span className="whitespace-nowrap">{t("announcement.socialProof1")}</span>
          <span className="text-[var(--color-gold-soft)]/40">•</span>
          <span className="whitespace-nowrap">{t("announcement.socialProof2")}</span>
          <span className="hidden text-[var(--color-gold-soft)]/40 lg:inline">•</span>
          <span className="hidden whitespace-nowrap lg:inline">{t("announcement.socialProof3")}</span>
        </div>
      </div>
    </div>
  );
}
