"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    id: "premium",
    image: "/hero5.png",
    alt: "Premium fashion campaign in refined neutral tones",
    objectPosition: "50% 5%",
    label: "NEW",
    title: "Modern Elegance",
    description: "Now available online.",
    premium: true,
  },
  {
    id: "campaign",
    image: "/hero1.png",
    alt: "Sami luxury studio campaign portrait",
    objectPosition: "72% 30%",
    label: "CAMPAIGN EDIT",
    title: "The Collection",
    description: "Designed to move with you.",
    premium: false,
  },
  {
    id: "evening",
    image: "/hero6.png",
    alt: "Sami dramatic fashion lighting campaign",
    objectPosition: "50% 8%",
    label: "EVENING LINE",
    title: "Confidence",
    description: "Elevated pieces for every moment.",
    premium: false,
  },
];

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, []);

  const slide = slides[activeIndex];

  return (
    <section className="relative left-1/2 right-1/2 -mt-6 h-screen w-screen max-w-none -translate-x-1/2 overflow-hidden sm:-mt-8">
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-[1100ms] ease-in-out ${
            index === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {s.premium ? (
            <>
              <Image
                src={s.image}
                alt={s.alt}
                fill
                sizes="100vw"
                quality={95}
                unoptimized
                className="scale-[1.12] object-cover blur-[3px] brightness-[0.42] saturate-[0.88] sm:blur-[4px]"
                style={{ objectPosition: s.objectPosition }}
                priority={index === 0}
              />
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/[0.58] via-black/[0.38] to-black/[0.72]"
                aria-hidden
              />
              <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px]" aria-hidden />
            </>
          ) : (
            <>
              <Image
                src={s.image}
                alt={s.alt}
                fill
                sizes="100vw"
                quality={95}
                unoptimized
                className="object-cover brightness-[0.92]"
                style={{
                  objectPosition: s.objectPosition,
                }}
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/50" />
            </>
          )}
        </div>
      ))}

      <div className="relative z-10 flex h-full items-center justify-center px-6 sm:px-12">
        <div
          key={slide.id}
          className="hero-content-fade max-w-4xl text-center"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-[var(--color-gold-soft)]">
            {slide.label}
          </p>
          <h1 className="mt-6 whitespace-pre-line font-serif text-[clamp(2.25rem,6vw,4.25rem)] font-light leading-[1.08] tracking-[0.04em] text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.45)]">
            {slide.title}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[13px] font-light leading-relaxed tracking-[0.06em] text-white/72 sm:text-[14px]">
            {slide.description}
          </p>
          <Link
            href="/products"
            className="mt-11 inline-flex min-h-[48px] items-center justify-center border border-white/25 bg-white px-10 py-3.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--color-black)] shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all duration-500 hover:border-white/40 hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
          >
            Shop Collection
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 sm:bottom-12">
        {slides.map((s, index) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`transition-all duration-500 ${
              index === activeIndex
                ? "h-[2px] w-8 bg-white"
                : "h-[2px] w-4 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
