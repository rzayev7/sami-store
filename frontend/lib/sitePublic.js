/** Public site copy — override with NEXT_PUBLIC_* in env if needed. */
export const SUPPORT_EMAIL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPPORT_EMAIL
    ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL
    : "samistore.support@gmail.com";

export const SUPPORT_WHATSAPP_DIGITS = "994554737996";
export const SUPPORT_WHATSAPP_DISPLAY = "+994554737996";

export function getWhatsappDigits() {
  const raw =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "" : "";
  const fromEnv = String(raw).replace(/\D/g, "");
  return fromEnv || SUPPORT_WHATSAPP_DIGITS;
}

export function getWhatsappDisplay() {
  const digits = getWhatsappDigits();
  return digits.startsWith("+") ? digits : `+${digits}`;
}
