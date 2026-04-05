import Link from "next/link";
import Image from "next/image";
import HeroSection from "../components/HeroSection";
import HeroGridSection from "../components/HeroGridSection";
import BestSellers from "../components/BestSellers";

export default function Home() {
  return (
    <div className="space-y-0">
      <HeroSection />

      {/* Editorial strip — Cinzel / font-serif to match SAMÍ headings */}
      <section className="w-full bg-[#F2F2F2]">
        <div className="mx-auto max-w-5xl px-10 py-28 text-center sm:px-16 sm:py-20">
          <div className="mx-auto mb-6 h-px w-12 bg-[var(--color-gold)]" aria-hidden />
          <h2 className="font-serif text-xl font-light leading-snug tracking-[0.06em] text-[var(--color-black)] sm:text-2xl sm:tracking-[0.05em] md:text-3xl md:tracking-[0.045em] lg:text-[2.35rem] lg:tracking-[0.04em]">
            Three Ways to Wear Elegance
          </h2>
        </div>
      </section>

      <HeroGridSection />

      <BestSellers />

      {/* Packaging — below collection; text left, image right */}
      <section className="overflow-hidden border-t border-[var(--color-line)]/80 bg-white">
        <div className="grid lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col justify-center px-8 py-16 sm:px-14 sm:py-20 lg:px-20 lg:py-24">
            <h2 className="max-w-md font-serif text-3xl font-light leading-[1.2] tracking-[0.03em] text-[var(--color-black)] sm:text-4xl lg:text-[2.5rem]">
              Beautifully packaged, thoughtfully delivered
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.75] tracking-[0.02em] text-[#4f4a45] sm:text-[16px] sm:leading-[1.8]">
              A refined shopping experience designed with the same care as every piece we offer.
            </p>
            <Link
              href="/products"
              className="group mt-10 inline-flex w-fit items-center gap-2.5 border-b-2 border-[var(--color-black)]/90 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-black)] transition-all hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] sm:text-xs sm:tracking-[0.2em]"
            >
              <span>Shop Collection</span>
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
    </div>
  );
}
