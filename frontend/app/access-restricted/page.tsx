export const metadata = {
  title: "Tezliklə | SAMÍ",
  description: "Sizə daha keyfiyyətli xidmət təqdim etmək üçün veb saytımız hazırlanır.",
};

export default function AccessRestrictedPage() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#F6F3EE] px-6 text-center">

      {/* Brand */}
      <p
        className="sami-brand text-[2.8rem] leading-none tracking-[0.08em] text-[#1a1714] sm:text-[3.5rem]"
        aria-label="SAMÍ"
      >
        SAMÍ
      </p>

      {/* Gold divider */}
      <div className="mx-auto mt-6 h-px w-12 bg-[#a68b5b]" aria-hidden />

      {/* Headline */}
      <h1 className="mt-8 max-w-sm font-serif text-[1.5rem] font-light leading-[1.35] tracking-[0.02em] text-[#1a1714] sm:text-[1.85rem]">
        Dəyərli müştərilər,
      </h1>

      {/* Body */}
      <p className="mx-auto mt-4 max-w-sm text-[14px] leading-[1.85] text-[#8a837a] sm:text-[15px]">
        Sizə daha keyfiyyətli xidmət təqdim etmək üçün veb saytımız hazırlanır.
      </p>
      <p className="mx-auto mt-2 max-w-sm text-[14px] leading-[1.85] text-[#8a837a] sm:text-[15px]">
        Çox yaxında xidmətinizdə olacağıq.
      </p>

      {/* Separator dots */}
      <div className="mt-8 flex items-center gap-1.5" aria-hidden>
        <span className="h-1 w-1 rounded-full bg-[#a68b5b]/40" />
        <span className="h-1 w-1 rounded-full bg-[#a68b5b]/70" />
        <span className="h-1 w-1 rounded-full bg-[#a68b5b]/40" />
      </div>

      {/* Contact */}
      <p className="mt-8 text-[12px] uppercase tracking-[0.16em] text-[#1a1714]/40">
        Questions?&nbsp;&nbsp;
        <a
          href="mailto:samistore.support@gmail.com"
          className="underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          samistore.support@gmail.com
        </a>
      </p>

      {/* Subtle footer note */}
      <p className="absolute bottom-6 text-[10px] uppercase tracking-[0.14em] text-[#1a1714]/25">
        &copy; {new Date().getFullYear()} SAMÍ. All rights reserved.
      </p>
    </div>
  );
}
