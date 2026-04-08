import Link from "next/link";
import { SUPPORT_EMAIL } from "../../lib/sitePublic";

export const metadata = {
  title: "Privacy Policy | SAMÍ",
  description: "How SAMÍ collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">Privacy Policy</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        Privacy Policy
      </h1>

      <p className="mt-8 text-[15px] leading-[1.85] text-black/70">
        SAMÍ (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
        committed to protecting your personal information. This policy explains
        what data we collect, how we use it, and your rights.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Information We Collect
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-[1.85] text-black/70">
          <li>
            <strong>Account information</strong> — name, email address, and
            password when you create an account.
          </li>
          <li>
            <strong>Order information</strong> — shipping address, phone number,
            and payment details when you place an order.
          </li>
          <li>
            <strong>Usage data</strong> — pages visited, browser type, and
            device information collected automatically to improve our website.
          </li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          How We Use Your Information
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-[1.85] text-black/70">
          <li>To process and deliver your orders.</li>
          <li>To communicate with you about your orders and account.</li>
          <li>To improve our website and services.</li>
          <li>To send order confirmations and shipping updates via email.</li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Data Sharing
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We do not sell your personal data. We share information only with
          trusted service providers that help us operate (payment processors,
          shipping carriers, email services), and only to the extent necessary
          to fulfil your order.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Legal Basis for Processing
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We process your personal data on the following grounds:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-[1.85] text-black/70">
          <li>
            <strong>Contract</strong> — to fulfil orders you place with us
            (shipping address, payment details, etc.).
          </li>
          <li>
            <strong>Consent</strong> — when you create an account or contact us
            voluntarily.
          </li>
          <li>
            <strong>Legitimate interest</strong> — to improve our website,
            prevent fraud, and ensure security.
          </li>
        </ul>
        <p className="text-[15px] leading-[1.85] text-black/70">
          You may withdraw your consent at any time by contacting us or deleting
          your account. Withdrawal does not affect the lawfulness of processing
          carried out before the withdrawal.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Cookies
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Our website uses cookies and similar technologies to keep you signed
          in, remember your preferences (such as currency), and understand how
          visitors use our site. These are essential for the website to function
          correctly.
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We do not use third-party advertising or tracking cookies. You can
          control or delete cookies through your browser settings at any time,
          although doing so may affect your experience on our site.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Data Retention
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We retain your personal data only for as long as necessary to provide
          our services and comply with legal obligations. Specifically:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-[1.85] text-black/70">
          <li>
            <strong>Account data</strong> — kept for as long as your account is
            active. You may request deletion at any time.
          </li>
          <li>
            <strong>Order records</strong> — retained for up to 5&nbsp;years to
            comply with tax and accounting regulations.
          </li>
          <li>
            <strong>Usage data</strong> — retained in anonymised or aggregated
            form and periodically purged.
          </li>
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Data Security
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We use industry-standard measures to protect your data, including
          encrypted connections (HTTPS), secure password storage, and restricted
          access to personal information.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Your Rights
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          You may request access to, correction of, or deletion of your personal
          data at any time by contacting us. If you have an account, you can
          update your information directly from your account page.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Contact
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          If you have any questions about this policy, please email us at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
