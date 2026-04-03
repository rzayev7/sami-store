"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    image: "/hero5.png",
    alt: "Sami campaign model in neutral tones",
    objectPosition: "72% 30%",
    label: "New Collection",
    title: "Timeless Elegance",
    description: "Refined silhouettes for the modern woman.",
  },
  {
    image: "/hero1.png",
    alt: "Sami luxury studio campaign portrait",
    objectPosition: "72% 30%",
    label: "Campaign Edit",
    title: "Luxury In Motion",
    description: "Statement pieces crafted for every moment.",
  },
  {
    image: "/hero6.png",
    alt: "Sami dramatic fashion lighting campaign",
    objectPosition: "50% 8%",
    label: "Evening Line",
    title: "Refined Glamour",
    description: "Elevated fabrics and timeless cuts.",
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

  return (
    <section className="relative left-1/2 right-1/2 -mt-6 h-screen w-screen max-w-none -translate-x-1/2 overflow-hidden sm:-mt-8">
      {slides.map((slide, index) => (
        <div
          key={slide.title}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            sizes="100vw"
            quality={95}
            unoptimized
            className="object-cover"
            style={{
              objectPosition: slide.objectPosition,
            }}
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/50" />
        </div>
      ))}

      <div className="relative z-10 flex h-full items-center justify-center px-6 sm:px-12">
        <div className="max-w-4xl text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[var(--color-gold-soft)]">
            {slides[activeIndex].label}
          </p>
          <h1 className="mt-5 whitespace-pre-line font-serif text-5xl font-light leading-[1.05] tracking-[0.03em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)] sm:text-6xl lg:text-7xl">
            {slides[activeIndex].title}
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-[13px] font-light leading-relaxed tracking-[0.04em] text-white/80 sm:text-sm">
            {slides[activeIndex].description}
          </p>
          <Link
            href="/products"
            className="mt-10 inline-flex border border-white/90 bg-white/95 px-11 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-black)] shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-500 hover:bg-white hover:shadow-xl"
          >
            Shop Collection
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 sm:bottom-12">
        {slides.map((_, index) => (
          <button
            key={index}
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
