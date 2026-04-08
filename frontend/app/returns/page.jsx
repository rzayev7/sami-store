import Link from "next/link";
import { SUPPORT_EMAIL } from "../../lib/sitePublic";

export const metadata = {
  title: "Returns Policy | SAMÍ",
  description:
    "Our returns and exchange policy for SAMÍ womenswear orders.",
};

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">Returns Policy</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        Returns Policy
      </h1>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          All Sales Are Final
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          As a newly launched brand, we do not currently offer standard returns
          or exchanges. All purchases are considered final. We encourage you to
          review our size guide and product descriptions carefully before placing
          your order.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Damaged, Defective, or Incorrect Items
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          If you receive an item that is damaged, defective, or different from
          what you ordered, we are happy to help. Please contact us within
          48&nbsp;hours of delivery so we can review the issue promptly.
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          To help us process your request, please include the following in your
          message:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-[1.85] text-black/70">
          <li>Your order number</li>
          <li>A description of the issue</li>
          <li>Clear photographs of the item and any damage</li>
        </ul>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Our team will review your case and get back to you as quickly as
          possible with a resolution, which may include a replacement or store
          credit at our discretion.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          How to Reach Us
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          For any questions about your order, email us at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {SUPPORT_EMAIL}
          </a>
          . We aim to respond within one business day.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Policy Updates
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          As SAMÍ grows, we plan to expand our returns options. This page will
          always reflect the most up-to-date version of our policy.
        </p>
      </section>
    </div>
  );
}
