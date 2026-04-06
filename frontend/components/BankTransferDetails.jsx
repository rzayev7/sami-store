import { SUPPORT_EMAIL } from "../lib/sitePublic";

const IBAN = "AZ28AIIB38817944006860051100";
const SWIFT = "AIIBAZ2X";
const ACCOUNT_NAME = "Samira Rzayeva";

/**
 * Bank transfer details for checkout (compact; no extra friction copy).
 * @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.showAfterPayment]
 */
export default function BankTransferDetails({ className = "", showAfterPayment = true }) {
  return (
    <div className={className}>
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/50 p-4 text-sm">
        <p className="mb-3 font-semibold text-black/90">Bank transfer</p>
        <div className="space-y-2 text-black/85">
          <p>
            <span className="text-black/55">IBAN:</span>{" "}
            <span className="break-all font-mono text-sm font-medium">{IBAN}</span>
          </p>
          <p>
            <span className="text-black/55">Name:</span> {ACCOUNT_NAME}
          </p>
          <p>
            <span className="text-black/55">SWIFT:</span>{" "}
            <span className="font-mono text-sm font-medium tracking-wide">{SWIFT}</span>
          </p>
        </div>
      </div>

      {showAfterPayment && (
        <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-white p-4 text-sm">
          <p className="mb-2 font-semibold text-black/90">After payment</p>
          <p className="text-black/80">Send your receipt via WhatsApp or email:</p>
          <p className="mt-2 text-black/85">
            <a
              href="https://wa.me/994554737996"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black underline decoration-black/30 underline-offset-2 hover:decoration-black"
            >
              +994554737996
            </a>
          </p>
          <p className="text-black/85">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-black underline decoration-black/30 underline-offset-2 hover:decoration-black"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
