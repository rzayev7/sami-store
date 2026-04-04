import Link from "next/link";

export const metadata = {
  title: "Shipping & Returns | SAMÍ",
  description: "Shipping and returns for SAMÍ womenswear.",
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">Shipping &amp; Returns</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        Shipping &amp; Returns
      </h1>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Shipping
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We ship worldwide. Standard delivery usually takes 7–14 business days. Express delivery
          is 3–5 business days where available. Free shipping on orders over $150.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Returns
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Size exchanges are accepted within 14 days. Items must be unworn, with tags attached.
          Contact us to start an exchange.
        </p>
      </section>
    </div>
  );
}
