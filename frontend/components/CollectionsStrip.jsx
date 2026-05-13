"use client";

import Image from "next/image";
import Link from "./LocaleLink";
import { useLanguage } from "../context/LanguageContext";
import { cloudinaryOptimizedUrl } from "../lib/image";

/**
 * Width budget for the collection tiles:
 *   4-col desktop (max-screen-2xl ~1536px, px-12 = 48px, gap-4 = 3×16px) → ~364px per tile
 *   2-col mobile  (375px, px-4, gap-2.5) → ~184px per tile
 * At 2× retina the largest case is ~730px → w_760 covers it comfortably.
 */
const TILE_WIDTH = 760;

const COLLECTIONS = [
  {
    id: "new-in",
    labelKey: "nav.newIn",
    href: "/products?newArrival=true",
    image: "https://res.cloudinary.com/dft6gmqtn/image/upload/v1778240911/photo4_xarhpq.png",
  },
  {
    id: "best-sellers",
    labelKey: "nav.bestSellersNav",
    href: "/products?bestSeller=true",
    image: "https://res.cloudinary.com/dft6gmqtn/image/upload/t_a/photo3_lgoxtz.png",
  },
  {
    id: "sets",
    labelKey: "nav.theSetEdit",
    href: "/products?category=Sets",
    image: "https://res.cloudinary.com/dft6gmqtn/image/upload/t_d/set2_mm2iff.png",
  },
  {
    id: "dresses",
    labelKey: "nav.eveningLooks",
    href: "/products?category=Dresses",
    image: "https://res.cloudinary.com/dft6gmqtn/image/upload/t_b/emerald1.png",
  },
];

export default function CollectionsStrip() {
  const { t } = useLanguage();

  return (
    <section className="w-full bg-[var(--color-cream)] pt-20 pb-10 sm:pt-24 sm:pb-14">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-12">

        {/* Section label */}
        <div className="mb-6 flex items-center gap-3 sm:mb-8">
          <div className="h-px w-8 bg-[var(--color-gold)]" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/45">
            {t("home.shopByStyle")}
          </p>
        </div>

        {/* 4-tile grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
          {COLLECTIONS.map((col, idx) => {
            const optimizedSrc = cloudinaryOptimizedUrl(col.image, { width: TILE_WIDTH });

            return (
              <Link
                key={col.id}
                href={col.href}
                className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-[var(--color-sand)]"
              >
                <Image
                  src={optimizedSrc}
                  alt={t(col.labelKey)}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.06]"
                  draggable={false}
                  priority={idx < 2}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                {/* Label */}
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 sm:text-[11px]">
                    {t(col.labelKey)}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-white/55 sm:text-[10px]">
                    {t("common.shopNow")}
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
                      →
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
