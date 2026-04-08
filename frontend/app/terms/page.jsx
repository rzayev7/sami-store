import Link from "next/link";
import { SUPPORT_EMAIL } from "../../lib/sitePublic";

export const metadata = {
  title: "Terms & Conditions | SAMÍ",
  description: "Terms and conditions for using the SAMÍ online store.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16 pt-4">
      <nav className="mb-8 text-[11px] font-medium uppercase tracking-[0.1em] text-black/40">
        <Link href="/" className="transition-colors hover:text-black/60">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black/55">Terms &amp; Conditions</span>
      </nav>

      <h1 className="font-serif text-3xl font-light tracking-[0.02em] text-[var(--color-black)] sm:text-4xl">
        Terms &amp; Conditions
      </h1>

      <p className="mt-8 text-[15px] leading-[1.85] text-black/70">
        By placing an order on the SAMÍ website you agree to the following
        terms. Please read them carefully before purchasing.
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Orders &amp; Pricing
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          All prices are displayed in the selected currency and are subject to
          change without notice. We reserve the right to cancel orders due to
          pricing errors, stock issues, or suspected fraud. You will be notified
          if your order is affected.
        </p>
        <p className="text-[15px] leading-[1.85] text-black/70">
          An order is not considered accepted until it has been confirmed by us.
          We reserve the right to refuse or cancel any order at our discretion.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Payment
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We accept bank transfers and, where available, card payments through
          our payment provider. Orders will only be processed and shipped after
          full payment has been successfully received and confirmed.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Sales &amp; Returns
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          All sales are final. We do not currently offer standard returns or
          exchanges. If you receive a damaged, defective, or incorrect item,
          please refer to our{" "}
          <Link
            href="/returns"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            Returns Policy
          </Link>{" "}
          for details on how to contact us.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Shipping
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Delivery times are estimates and may vary depending on your location
          and customs processing. SAMÍ is not responsible for delays caused by
          third-party carriers or customs authorities. For full details, see
          our{" "}
          <Link
            href="/shipping"
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            Shipping
          </Link>{" "}
          page.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Accuracy of Information
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          You are responsible for providing accurate and complete information
          when placing an order. We are not responsible for issues arising from
          incorrect details provided by the customer.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Intellectual Property
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          All content on this website — including images, text, logos, and
          designs — is the property of SAMÍ and may not be reproduced without
          written permission.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Limitation of Liability
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          SAMÍ is not liable for any indirect, incidental, or consequential
          damages arising from the use of our website or products, to the
          fullest extent permitted by applicable law.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Changes to These Terms
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          We may update these terms at any time. Changes take effect
          immediately upon publication on this page. Continued use of the
          website constitutes acceptance of the updated terms.
        </p>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-black)]">
          Contact
        </h2>
        <p className="text-[15px] leading-[1.85] text-black/70">
          Questions about these terms? Email us at{" "}
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
