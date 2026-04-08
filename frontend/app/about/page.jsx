"use client";

import Image from "next/image";
import Link from "../../components/LocaleLink";
import { useLanguage } from "../../context/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full pb-16 pt-4">
      <nav className="mx-auto mb-8 max-w-4xl px-0 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          {t("common.home")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">{t("footer.about")}</span>
      </nav>

      <div className="relative -mx-4 mb-12 aspect-[21/9] min-h-[200px] w-[calc(100%+2rem)] max-w-none overflow-hidden bg-[var(--color-sand)] sm:-mx-6 sm:w-[calc(100%+3rem)] lg:mx-0 lg:w-full lg:rounded-lg">
        <Image
          src="/hero6.png"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>

      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
          {t("about.title")}
        </h1>
        <p className="mt-8 text-[15px] leading-[1.9] text-black/75">
          {t("about.body")}
        </p>
      </div>
    </div>
  );
}
