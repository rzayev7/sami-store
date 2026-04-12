"use client";

import { useLanguage } from "../context/LanguageContext";
import { SUPPORT_EMAIL } from "../lib/sitePublic";

const RECIPIENT_NAME = "Samira Rzayeva";
const RECIPIENT_LOCATION = "Baku, Azerbaijan";

/**
 * Western Union recipient details for checkout (compact).
 * @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.showAfterPayment]
 */
export default function WesternUnionDetails({ className = "", showAfterPayment = true }) {
  const { t } = useLanguage();

  return (
    <div className={className}>
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/50 p-4 text-sm">
        <p className="mb-3 font-semibold text-black/90">{t("bankTransfer.westernUnion")}</p>
        <div className="space-y-2 text-black/85">
          <p>
            <span className="text-black/55">{t("bankTransfer.name")}</span> {RECIPIENT_NAME}
          </p>
          <p>
            <span className="text-black/55">{t("bankTransfer.recipientLocation")}</span> {RECIPIENT_LOCATION}
          </p>
        </div>
      </div>

      {showAfterPayment && (
        <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-white p-4 text-sm">
          <p className="mb-2 font-semibold text-black/90">{t("bankTransfer.afterPayment")}</p>
          <p className="text-black/80">{t("bankTransfer.sendReceipt")}</p>
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
