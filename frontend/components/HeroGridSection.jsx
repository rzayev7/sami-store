import Image from "next/image";
import Link from "next/link";

const heroSlides = [
  {
    title: "New Arrivals",
    cta: "Shop Now",
    image: "/hero1.png",
    alt: "Model in latest new arrivals fashion",
  },
  {
    title: "Evening Edit",
    cta: "Explore",
    image: "/hero3.png",
    alt: "Elegant evening collection look",
  },
  {
    title: "Summer Styles",
    cta: "Discover",
    image: "/hero2.png",
    alt: "Bright summer style outfit",
  },
];

export default function HeroGridSection() {
  return (
    <section className="relative left-1/2 right-1/2 w-screen max-w-none -translate-x-1/2">
      <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {heroSlides.map((slide) => (
          <Link
            key={slide.title}
            href="/products"
            className="group relative block h-[70vh] overflow-hidden md:h-[90vh]"
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

            <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-14 text-center text-white">
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
