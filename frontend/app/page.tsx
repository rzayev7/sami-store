"use client";

import Link from "../components/LocaleLink";
import Image from "next/image";
import HeroSection from "../components/HeroSection";
import HeroGridSection from "../components/HeroGridSection";
import BestSellers from "../components/BestSellers";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const { t } = useLanguage() as { t: (key: string, params?: Record<string, string>) => string };
  const followUsTitleRaw = t("home.followUs");
  const followUsDescRaw = t("home.followUsDesc");
  const followOnInstagramRaw = t("home.followOnInstagram");
  const followUsTitle = followUsTitleRaw && !followUsTitleRaw.startsWith("home.") ? followUsTitleRaw : "Follow Our Journey";
  const followUsDesc =
    followUsDescRaw && !followUsDescRaw.startsWith("home.")
      ? followUsDescRaw
      : "See new arrivals, styling ideas, and behind-the-scenes from our studio in Baku.";
  const followOnInstagram =
    followOnInstagramRaw && !followOnInstagramRaw.startsWith("home.")
      ? followOnInstagramRaw
      : "Follow on Instagram";

  return (
    <div className="space-y-0">
      <HeroSection />

      <section className="w-full bg-[#F2F2F2]">
        <div className="mx-auto max-w-5xl px-10 py-28 text-center sm:px-16 sm:py-20">
          <div className="mx-auto mb-6 h-px w-12 bg-[var(--color-gold)]" aria-hidden />
          <h2 className="font-serif text-xl font-light leading-snug tracking-[0.06em] text-[var(--color-black)] sm:text-2xl sm:tracking-[0.05em] md:text-3xl md:tracking-[0.045em] lg:text-[2.35rem] lg:tracking-[0.04em]">
            {t("home.threeWays")}
          </h2>
        </div>
      </section>

      <HeroGridSection />

      <BestSellers />

      <section className="overflow-hidden border-t border-[var(--color-line)]/80 bg-white">
        <div className="grid lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col justify-center px-8 py-16 sm:px-14 sm:py-20 lg:px-20 lg:py-24">
            <h2 className="max-w-md font-serif text-3xl font-light leading-[1.2] tracking-[0.03em] text-[var(--color-black)] sm:text-4xl lg:text-[2.5rem]">
              {t("home.packaging")}
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.75] tracking-[0.02em] text-[#4f4a45] sm:text-[16px] sm:leading-[1.8]">
              {t("home.packagingDesc")}
            </p>
            <Link
              href="/products"
              className="group mt-10 inline-flex w-fit items-center gap-2.5 border-b-2 border-[var(--color-black)]/90 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-black)] transition-all hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] sm:text-xs sm:tracking-[0.2em]"
            >
              <span>{t("common.shopCollection")}</span>
              <span
                className="text-[14px] font-semibold leading-none text-current transition-transform duration-300 group-hover:translate-x-1 sm:text-base"
                aria-hidden
              >
                →
              </span>
            </Link>
          </div>

          <div className="relative min-h-[420px] w-full sm:min-h-[520px] lg:min-h-[560px]">
            <Image
              src="/Elegant%20minimalist%20packaging%20display.png"
              alt="SAMÍ minimalist packaging — bags and boxes"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={95}
              unoptimized
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      {/* Instagram section */}
      <section className="border-t border-[var(--color-line)]/60 bg-[#F6F3EF] pt-18 pb-8 sm:pt-24 sm:pb-10">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-[30px] border border-black/10 bg-white/70 px-7 py-12 text-center backdrop-blur-sm sm:px-10 sm:py-14">
            <a
              href="https://www.instagram.com/sami_boutique_baku/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SAMÍ on Instagram"
              className="group mx-auto inline-flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] p-[1px] transition-transform duration-300 hover:scale-[1.03]"
            >
              <span className="flex h-full w-full items-center justify-center rounded-[22px] bg-[#111]">
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1.2" fill="white" stroke="none" />
                </svg>
              </span>
            </a>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-black)]/45">
              @sami_boutique_baku
            </p>

            <div className="mx-auto mt-4 h-px w-12 bg-[var(--color-gold)]" aria-hidden />

            <h2 className="mt-5 font-serif text-[2rem] font-light leading-[1.2] tracking-[0.03em] text-[var(--color-black)] sm:text-[2.35rem]">
              {followUsTitle}
            </h2>

            <p className="mx-auto mt-4 max-w-md text-[14px] leading-[1.8] tracking-[0.01em] text-[#4f4a45] sm:text-[15px]">
              {followUsDesc}
            </p>

            <a
              href="https://www.instagram.com/sami_boutique_baku/"
              target="_blank"
              rel="noopener noreferrer"
              className="group mx-auto mt-9 inline-flex min-h-[52px] items-center gap-2.5 rounded-full bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] px-9 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-transform duration-200 hover:scale-[1.02]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
              </svg>
              {followOnInstagram}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
