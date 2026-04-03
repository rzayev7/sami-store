const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";

function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return "";
  return String(rawPhone).replace(/[^\d]/g, "");
}

function formatOrderMessage(order) {
  const customer = order?.customerInfo?.name || "Unknown customer";
  const phone = order?.customerInfo?.phone || "-";
  const country = order?.customerInfo?.country || "-";
  const total = Number(order?.totalPriceUSD || 0).toFixed(2);
  const itemLines = Array.isArray(order?.items)
    ? order.items
        .slice(0, 6)
        .map(
          (item, index) =>
            `${index + 1}. ${item?.name || "Item"} x${Number(item?.quantity || 0)} (${Number(
              item?.priceUSD || 0
            ).toFixed(2)} USD)`
        )
        .join("\n")
    : "No items";

  const suffix = Array.isArray(order?.items) && order.items.length > 6 ? "\n..." : "";

  return (
    `New Sami Order\n` +
    `Order ID: ${order?._id}\n` +
    `Customer: ${customer}\n` +
    `Phone: ${phone}\n` +
    `Country: ${country}\n` +
    `Total: ${total} USD\n\n` +
    `Items:\n${itemLines}${suffix}`
  );
}

async function sendWhatsAppOrderNotification(order) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const defaultTo = process.env.WHATSAPP_TO_NUMBER || "";

  if (!accessToken || !phoneNumberId || !defaultTo) {
    return { sent: false, reason: "missing_whatsapp_env" };
  }

  const recipient = normalizePhoneNumber(defaultTo);
  if (!recipient) {
    return { sent: false, reason: "invalid_destination_number" };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "text",
    text: {
      preview_url: false,
      body: formatOrderMessage(order),
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { sent: false, reason: `whatsapp_api_error:${response.status}`, details: errorText };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, reason: "request_failed", details: error?.message || "unknown_error" };
  }
}

module.exports = {
  sendWhatsAppOrderNotification,
};
