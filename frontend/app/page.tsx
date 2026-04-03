import Link from "next/link";
import Image from "next/image";
import HeroSection from "../components/HeroSection";
import HeroGridSection from "../components/HeroGridSection";
import BestSellers from "../components/BestSellers";

export default function Home() {
  return (
    <div className="space-y-0">
      <HeroSection />

      {/* Brand statement */}
      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center sm:py-20">
          <div className="mx-auto mb-6 h-px w-12 bg-[var(--color-gold)]" />
          <h2 className="font-serif text-2xl font-light tracking-[0.04em] text-[var(--color-black)] sm:text-3xl">
            Crafted for timeless elegance
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[13px] leading-[1.9] tracking-[0.02em] text-[var(--color-muted)]">
            Elevated silhouettes and refined details designed for modern, confident women.
            Each piece is a balance of grace and intention.
          </p>
        </div>
      </section>

      <HeroGridSection />

      <BestSellers />

      {/* Designed in Baku */}
      <section className="overflow-hidden bg-white">
        <div className="grid lg:grid-cols-2 lg:items-center">
          <div className="px-8 py-16 sm:px-14 sm:py-20 lg:px-20 lg:py-28">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--color-gold)]">
              Designed in Baku
            </p>
            <h2 className="mt-5 font-serif text-3xl font-light leading-[1.15] tracking-[0.03em] text-[var(--color-black)] sm:text-4xl lg:text-[2.75rem]">
              Timeless elegance inspired by modern femininity.
            </h2>
            <p className="mt-6 max-w-md text-[13px] leading-[1.9] tracking-[0.02em] text-[var(--color-muted)]">
              Crafted with luxurious fabrics and refined silhouettes, every piece
              embodies quiet confidence and graceful simplicity.
            </p>

            <div className="mt-10 flex items-center gap-8 text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
              <span>Premium Fabrics</span>
              <span className="text-[var(--color-line)]">·</span>
              <span>Refined Cuts</span>
              <span className="text-[var(--color-line)]">·</span>
              <span>Timeless</span>
            </div>

            <Link
              href="/products"
              className="mt-10 inline-flex border-b border-[var(--color-black)] pb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-black)] transition-all hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
            >
              Explore Collection
            </Link>
          </div>

          <div className="relative h-[480px] w-full sm:h-[640px] lg:h-full lg:min-h-[600px]">
            <Image
              src="/hero6.png"
              alt="Sami model photo for Designed in Baku campaign"
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
