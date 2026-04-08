import Link from "next/link";

export const metadata = {
  title: "Shipping | SAMÍ",
  description: "Shipping information for SAMÍ womenswear orders.",
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">Shipping</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        Shipping
      </h1>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Worldwide Delivery
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We ship to most countries worldwide. All orders include complimentary
          shipping.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Delivery Times
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Standard delivery usually takes 7–14 business days depending on your
          location. Express delivery (3–5 business days) is available in
          selected regions.
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Please note that delivery times are estimates. International orders
          may be subject to customs processing, which can add additional time
          beyond our control.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Order Tracking
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Once your order has shipped, you will receive an email with tracking
          information. You can also check your order status on our{" "}
          <Link
            href="/track-order"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            Track Order
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Returns
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          All sales are final. If you receive a damaged, defective, or
          incorrect item, please see our{" "}
          <Link
            href="/returns"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            Returns Policy
          </Link>{" "}
          for next steps.
        </p>
      </section>
    </div>
  );
}
