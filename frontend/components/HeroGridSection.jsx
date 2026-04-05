import Image from "next/image";
import Link from "next/link";

const heroSlides = [
  {
    title: "New Arrivals",
    href: "/products/new-arrivals",
    cta: "Shop Now",
    image: "/Confident%20in%20red%20paisley%20pattern.png",
    alt: "Model in red linen paisley set — confident studio look",
  },
  {
    title: "Featured",
    href: "/products/featured",
    cta: "Explore",
    image: "/Elegant%20woman%20in%20chic%20linen%20outfit.png",
    alt: "Elegant woman in chic beige linen outfit — studio portrait",
  },
  {
    title: "Shop All",
    href: "/products",
    cta: "Discover",
    image: "/Elegant%20in%20sage%20green%20and%20florals.png",
    alt: "Elegant sage green floral look — full collection",
  },
];

export default function HeroGridSection() {
  return (
    <section className="relative left-1/2 right-1/2 w-screen max-w-none -translate-x-1/2">
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {heroSlides.map((slide) => (
          <Link
            key={slide.title}
            href={slide.href}
            className="group relative block h-[64vh] max-h-[680px] overflow-hidden md:h-[76vh] md:max-h-[780px] lg:h-[72vh] lg:max-h-[740px]"
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={92}
              unoptimized
              className="object-cover object-[center_28%]"
            />

            <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/25" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-10 text-center text-white sm:pb-12">
              <h2 className="font-serif text-3xl font-light tracking-[0.04em] sm:text-4xl">
                {slide.title}
              </h2>
              <span className="mt-5 border-b border-white/50 pb-0.5 text-[10px] font-medium uppercase tracking-[0.24em] text-white/80 transition-all group-hover:border-white group-hover:text-white">
                {slide.cta}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
