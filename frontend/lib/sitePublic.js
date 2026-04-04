/** Public site copy — set NEXT_PUBLIC_SUPPORT_EMAIL on Vercel when ready. */
export const SUPPORT_EMAIL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPPORT_EMAIL
    ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL
    : "[SUPPORT_EMAIL]";

export function getWhatsappDigits() {
  const raw =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "" : "";
  return String(raw).replace(/\D/g, "");
}
