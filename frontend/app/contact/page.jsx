import Link from "next/link";
import { SUPPORT_EMAIL } from "../../lib/sitePublic";

export const metadata = {
  title: "Contact | SAMÍ",
  description: "Get in touch with the SAMÍ team.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">Contact</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        Contact Us
      </h1>

      <p className="mt-8 text-[15px] leading-[1.85] text-black/70">
        We would love to hear from you. Whether you have a question about an
        order, need help with sizing, or just want to say hello — our team is
        here to help.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Email
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We aim to respond within one business day.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          WhatsApp
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          You can also reach us on WhatsApp for quick questions about orders or
          products.
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          <a
            href="https://wa.me/994554737996"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            +994 55 473 79 96
          </a>
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Social Media
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Follow us on{" "}
          <a
            href="https://www.instagram.com/sami_boutique_baku/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            Instagram
          </a>{" "}
          for new arrivals, styling inspiration, and updates.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Business Inquiries
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          For wholesale, press, or collaboration requests, please email us with
          the subject line &ldquo;Business Inquiry&rdquo; and we will get back
          to you.
        </p>
      </section>
    </div>
  );
}
