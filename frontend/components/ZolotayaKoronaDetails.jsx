"use client";

import { useLanguage } from "../context/LanguageContext";
import { SUPPORT_EMAIL } from "../lib/sitePublic";

const RECIPIENT_NAME = "Sahib Rzayev";
const PHONE_E164 = "994554737996";
const PHONE_DISPLAY = "+994554737996";

/**
 * Zolotaya Korona (Golden Crown) transfer details for checkout.
 * @param {object} props
 * @param {string} [props.className]
 * @param {boolean} [props.showAfterPayment]
 */
export default function ZolotayaKoronaDetails({ className = "", showAfterPayment = true }) {
  const { t } = useLanguage();

  return (
    <div className={className}>
      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/50 p-4 text-sm">
        <p className="mb-3 font-semibold text-black/90">{t("bankTransfer.zolotayaKorona")}</p>
        <div className="space-y-2 text-black/85">
          <p>
            <span className="text-black/55">{t("bankTransfer.name")}</span> {RECIPIENT_NAME}
          </p>
          <p>
            <span className="text-black/55">{t("bankTransfer.recipientPhone")}</span>{" "}
            <a href={`tel:+${PHONE_E164}`} className="font-medium text-black underline decoration-black/30 underline-offset-2 hover:decoration-black">
              {PHONE_DISPLAY}
            </a>
          </p>
        </div>
      </div>

      {showAfterPayment && (
        <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-white p-4 text-sm">
          <p className="mb-2 font-semibold text-black/90">{t("bankTransfer.afterPayment")}</p>
          <p className="text-black/80">{t("bankTransfer.sendReceipt")}</p>
          <p className="mt-2 text-black/85">
            <a
              href={`https://wa.me/${PHONE_E164}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black underline decoration-black/30 underline-offset-2 hover:decoration-black"
            >
              {PHONE_DISPLAY}
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
