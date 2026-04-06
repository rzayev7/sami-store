/** Public site copy — override with NEXT_PUBLIC_SUPPORT_EMAIL in env if needed. */
export const SUPPORT_EMAIL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPPORT_EMAIL
    ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL
    : "samistore.support@gmail.com";

export function getWhatsappDigits() {
  const raw =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "" : "";
  return String(raw).replace(/\D/g, "");
}
