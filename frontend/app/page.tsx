"use client";

import Link from "../components/LocaleLink";
import Image from "next/image";
import SaleCountdownHero from "../components/SaleCountdownHero";
// import HeroSection from "../components/HeroSection"; // switch back when sale ends
import BestSellers from "../components/BestSellers";
import CollectionsStrip from "../components/CollectionsStrip";
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
      <SaleCountdownHero />

      {/* Products visible immediately after hero — critical for mobile conversion */}
      <CollectionsStrip />

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
      <section className="border-t border-[var(--color-line)]/60 bg-[#F6F3EF] pt-16 pb-10 sm:pt-20 sm:pb-12">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-[34px] border border-black/8 bg-white px-7 py-12 text-center shadow-[0_12px_40px_rgba(16,14,12,0.06)] sm:px-10 sm:py-14">
            <a
              href="https://www.instagram.com/sami_boutique_baku/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SAMÍ on Instagram"
              className="group mx-auto inline-flex items-center justify-center transition-transform duration-300 hover:scale-[1.03]"
            >
              <Image
                src="/instagram.png"
                alt=""
                aria-hidden
                width={46}
                height={46}
                className="h-[46px] w-[46px] object-contain"
              />
            </a>

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.23em] text-[var(--color-black)]/45">
              @sami_boutique_baku
            </p>

            <div className="mx-auto mt-4 h-px w-12 bg-[var(--color-gold)]" aria-hidden />

            <h2 className="mt-5 font-serif text-[1.9rem] font-light leading-[1.2] tracking-[0.025em] text-[var(--color-black)] sm:text-[2.25rem]">
              {followUsTitle}
            </h2>

            <p className="mx-auto mt-4 max-w-md text-[14px] leading-[1.85] tracking-[0.01em] text-[#4f4a45] sm:text-[15px]">
              {followUsDesc}
            </p>

            <a
              href="https://www.instagram.com/sami_boutique_baku/"
              target="_blank"
              rel="noopener noreferrer"
              className="group mx-auto mt-9 inline-flex min-h-[50px] items-center gap-2 rounded-full border border-[var(--color-black)]/20 bg-white px-9 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-black)] transition-all duration-200 hover:border-[var(--color-black)]/45 hover:bg-[#faf8f5]"
            >
              <Image
                src="/instagram.png"
                alt=""
                aria-hidden
                width={16}
                height={16}
                className="h-[15px] w-[15px] object-contain"
              />
              {followOnInstagram}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
