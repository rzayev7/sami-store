const { Resend } = require("resend");

let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const safeSendMail = async ({ from, to, subject, html, replyTo }) => {
  if (!resend) {
    console.log("[emailService] RESEND_API_KEY not configured, skipping email send.");
    return { sent: false, reason: "resend_not_configured" };
  }

  try {
    await resend.emails.send({
      from: from || process.env.EMAIL_FROM || "onboarding@resend.dev",
      to,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("[emailService] Failed to send email via Resend:", error.message || error);
    return { sent: false, reason: error.message || "send_failed" };
  }
};

const formatMoney = (value) => {
  const num = Number(value || 0);
  return `₼${num.toFixed(2)}`;
};

const buildOrderLinesHtml = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return "<p>No items.</p>";

  const rows = items
    .map((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.priceUSD || 0);
      const lineTotal = price * qty;
      return `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 13px;">
            ${item.name || "-"}${item.code ? ` <span style="color:#999;">(${item.code})</span>` : ""}
            ${item.size || item.color ? `<div style="color:#777; font-size:11px;">${item.size || ""}${item.color ? ` · ${item.color}` : ""}</div>` : ""}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 13px; text-align:center;">
            ${qty}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 13px; text-align:right;">
            ${formatMoney(price)}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 13px; text-align:right;">
            ${formatMoney(lineTotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.priceUSD || 0) * Number(item.quantity || 0),
    0,
  );

  const shipping = Number(order.shippingCost || 0);
  const total = Number(order.totalPriceUSD || subtotal + shipping || 0);

  return `
    <table style="width:100%; border-collapse:collapse; margin-top: 8px;">
      <thead>
        <tr>
          <th style="text-align:left; padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 12px;">Product</th>
          <th style="text-align:center; padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 12px;">Qty</th>
          <th style="text-align:right; padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 12px;">Price</th>
          <th style="text-align:right; padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 12px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 6px 8px; text-align:right; font-size: 13px; color:#555;">Subtotal:</td>
          <td style="padding: 6px 8px; text-align:right; font-size: 13px;">${formatMoney(subtotal)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 2px 8px; text-align:right; font-size: 13px; color:#555;">Shipping:</td>
          <td style="padding: 2px 8px; text-align:right; font-size: 13px;">${formatMoney(shipping)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 6px 8px; text-align:right; font-size: 13px; font-weight:bold;">Total:</td>
          <td style="padding: 6px 8px; text-align:right; font-size: 13px; font-weight:bold;">${formatMoney(total)}</td>
        </tr>
      </tfoot>
    </table>
  `;
};

const buildAddressHtml = (customerInfo = {}) => {
  const parts = [
    customerInfo.address,
    customerInfo.city,
    customerInfo.state,
    customerInfo.postalCode,
    customerInfo.country,
  ].filter(Boolean);

  return `
    <p style="margin:0; font-size:13px; color:#333;">
      ${(customerInfo.name || "").trim()}<br/>
      ${parts.join(", ") || "-"}<br/>
      ${customerInfo.phone || ""}
      ${customerInfo.taxNumber ? `<br/>Tax / VAT: ${customerInfo.taxNumber}` : ""}
    </p>
  `;
};

const getBaseStoreUrl = () => {
  return process.env.STORE_BASE_URL || "https://samiofficial.store";
};

const sendOrderConfirmationEmail = async (order) => {
  if (!order || !order.customerInfo?.email) {
    return { sent: false, reason: "missing_email" };
  }

  const storeUrl = getBaseStoreUrl();
  const orderIdShort = String(order._id || "").slice(-8).toUpperCase();
  const subject = `Your Sami order ${orderIdShort} has been received`;

  const supportEmail = process.env.SUPPORT_EMAIL || "samistore.support@gmail.com";

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111; padding:16px; background:#f7f5f0;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px 24px 28px; box-shadow:0 8px 30px rgba(15,23,42,0.08);">
        <h1 style="font-size:24px; font-weight:500; letter-spacing:0.04em; text-transform:uppercase; margin:0 0 8px;">SAMI</h1>
        <p style="margin:4px 0 18px; font-size:13px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Order Confirmation</p>

        <p style="font-size:14px; margin:0 0 8px;">Thank you for your order.</p>
        <p style="font-size:13px; margin:0 0 16px; color:#4b5563;">
          Your order has been received and is now being prepared. You will receive shipping updates as soon as your package is on its way.
        </p>

        <div style="margin:16px 0 18px; padding:12px 14px; background:#f9fafb; border-radius:10px; border:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.16em; color:#6b7280; margin-bottom:4px;">Order</div>
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:13px; font-weight:600;">#${orderIdShort}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.16em; color:#6b7280; margin-bottom:4px;">Total</div>
            <div style="font-size:14px; font-weight:600;">${formatMoney(order.totalPriceUSD || order.totalPrice || 0)}</div>
          </div>
        </div>

        <h2 style="font-size:13px; text-transform:uppercase; letter-spacing:0.16em; margin:24px 0 8px; color:#6b7280;">Items</h2>
        ${buildOrderLinesHtml(order)}

        <div style="display:flex; flex-wrap:wrap; gap:16px; margin-top:24px;">
          <div style="flex:1 1 220px;">
            <h3 style="font-size:12px; text-transform:uppercase; letter-spacing:0.16em; margin:0 0 8px; color:#6b7280;">Shipping Address</h3>
            ${buildAddressHtml(order.customerInfo)}
          </div>
        </div>

        <p style="margin-top:24px; font-size:12px; color:#4b5563;">
          You can track your order status at any time:
        </p>
        <p style="margin-top:4px;">
          <a href="${storeUrl}/track-order" style="font-size:12px; text-decoration:none; padding:9px 16px; border-radius:999px; background:#111827; color:white; letter-spacing:0.16em; text-transform:uppercase; display:inline-block;">
            Track Order
          </a>
        </p>

        <p style="margin-top:24px; font-size:11px; color:#9ca3af;">
          This email also serves as your purchase confirmation and invoice.
        </p>

        <p style="margin-top:16px; font-size:11px; color:#9ca3af;">
          If you have any questions, contact us at <a href="mailto:${supportEmail}" style="color:#6b7280;">${supportEmail}</a>.
        </p>
      </div>
    </div>
  `;

  return safeSendMail({
    from: process.env.EMAIL_FROM,
    to: order.customerInfo.email,
    replyTo: supportEmail,
    subject,
    html,
  });
};

const sendAdminNewOrderNotificationEmail = async (order) => {
  const supportEmail = process.env.SUPPORT_EMAIL || "samistore.support@gmail.com";
  if (!order || !supportEmail) {
    return { sent: false, reason: "missing_order_or_support_email" };
  }

  const orderIdShort = String(order._id || "").slice(-8).toUpperCase();
  const customer = order.customerInfo || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const itemsCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const paymentMethod = String(order.paymentMethod || "-").toUpperCase();

  const subject = `New order received #${orderIdShort}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111; padding:16px; background:#f7f5f0;">
      <div style="max-width:700px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px 24px 28px; box-shadow:0 8px 30px rgba(15,23,42,0.08);">
        <h1 style="font-size:22px; font-weight:600; margin:0 0 6px;">New Order Alert</h1>
        <p style="margin:0 0 18px; font-size:13px; color:#6b7280;">A customer has placed a new order on your store.</p>

        <div style="margin:0 0 16px; padding:12px 14px; background:#f9fafb; border-radius:10px; border:1px solid #e5e7eb;">
          <p style="margin:0 0 4px; font-size:13px;"><strong>Order ID:</strong> #${orderIdShort}</p>
          <p style="margin:0 0 4px; font-size:13px;"><strong>Created:</strong> ${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
          <p style="margin:0 0 4px; font-size:13px;"><strong>Payment:</strong> ${paymentMethod}</p>
          <p style="margin:0; font-size:13px;"><strong>Total:</strong> ${formatMoney(order.totalPriceUSD || 0)}</p>
        </div>

        <div style="margin:0 0 16px; padding:12px 14px; background:#f9fafb; border-radius:10px; border:1px solid #e5e7eb;">
          <p style="margin:0 0 4px; font-size:13px;"><strong>Customer:</strong> ${customer.name || "-"}</p>
          <p style="margin:0 0 4px; font-size:13px;"><strong>Email:</strong> ${customer.email || "-"}</p>
          <p style="margin:0; font-size:13px;"><strong>Phone:</strong> ${customer.phone || "-"}</p>
        </div>

        <p style="margin:0 0 6px; font-size:13px;"><strong>Items (${itemsCount}):</strong></p>
        ${buildOrderLinesHtml(order)}
      </div>
    </div>
  `;

  return safeSendMail({
    from: process.env.EMAIL_FROM,
    to: supportEmail,
    subject,
    html,
  });
};

const sendShippingEmail = async (order) => {
  if (!order || !order.customerInfo?.email) {
    return { sent: false, reason: "missing_email" };
  }

  if (!order.trackingNumber) {
    return { sent: false, reason: "missing_tracking" };
  }

  const storeUrl = getBaseStoreUrl();
  const orderIdShort = String(order._id || "").slice(-8).toUpperCase();
  const subject = `Your Sami order ${orderIdShort} is on the way`;
  const carrierName = order.shippingCarrier || "Your selected carrier";
  const trackingLink =
    order.trackingUrl ||
    `${storeUrl}/track-order?orderId=${encodeURIComponent(order._id.toString())}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111; padding:16px; background:#f7f5f0;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px 24px 28px; box-shadow:0 8px 30px rgba(15,23,42,0.08);">
        <h1 style="font-size:24px; font-weight:500; letter-spacing:0.04em; text-transform:uppercase; margin:0 0 8px;">SAMI</h1>
        <p style="margin:4px 0 18px; font-size:13px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Shipping Update</p>

        <p style="font-size:14px; margin:0 0 8px;">Your order is on its way.</p>
        <p style="font-size:13px; margin:0 0 16px; color:#4b5563;">
          Your order #${orderIdShort} has been shipped. You can track the delivery using the details below.
        </p>

        <div style="margin:14px 0 18px; padding:12px 14px; background:#f9fafb; border-radius:10px; border:1px solid #e5e7eb;">
          <p style="margin:0 0 6px; font-size:13px;">
            <strong>Tracking number:</strong> <span style="font-family:ui-monospace; letter-spacing:0.12em;">${order.trackingNumber}</span>
          </p>
          <p style="margin:0 0 6px; font-size:13px;">
            <strong>Carrier:</strong> ${carrierName}
          </p>
          <p style="margin:0 0 10px; font-size:13px;">
            <strong>Track here:</strong>
            <a href="${trackingLink}" style="color:#111827; text-decoration:underline;">${trackingLink}</a>
          </p>
          <p style="margin:0; font-size:12px; color:#6b7280;">
            Estimated delivery timelines vary by destination. You will receive another email once your order is delivered.
          </p>
        </div>

        <h2 style="font-size:13px; text-transform:uppercase; letter-spacing:0.16em; margin:20px 0 8px; color:#6b7280;">Summary</h2>
        ${buildOrderLinesHtml(order)}

        <p style="margin-top:24px; font-size:12px; color:#4b5563;">
          You can also view this order in your account:
        </p>
        <p style="margin-top:4px;">
          <a href="${storeUrl}/account?tab=orders" style="font-size:12px; text-decoration:none; padding:9px 16px; border-radius:999px; background:#111827; color:white; letter-spacing:0.16em; text-transform:uppercase; display:inline-block;">
            View in My Account
          </a>
        </p>
      </div>
    </div>
  `;

  return safeSendMail({
    from: process.env.EMAIL_FROM,
    to: order.customerInfo.email,
    replyTo: process.env.SUPPORT_EMAIL || "samistore.support@gmail.com",
    subject,
    html,
  });
};

const sendDeliveryEmail = async (order) => {
  if (!order || !order.customerInfo?.email) {
    return { sent: false, reason: "missing_email" };
  }

  const storeUrl = getBaseStoreUrl();
  const orderIdShort = String(order._id || "").slice(-8).toUpperCase();
  const subject = `Your Sami order ${orderIdShort} has been delivered`;

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#111; padding:16px; background:#f7f5f0;">
      <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px 24px 28px; box-shadow:0 8px 30px rgba(15,23,42,0.08);">
        <h1 style="font-size:24px; font-weight:500; letter-spacing:0.04em; text-transform:uppercase; margin:0 0 8px;">SAMI</h1>
        <p style="margin:4px 0 18px; font-size:13px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Delivery Confirmation</p>

        <p style="font-size:14px; margin:0 0 8px;">Your order has been delivered.</p>
        <p style="font-size:13px; margin:0 0 16px; color:#4b5563;">
          We hope you enjoy your new pieces. If anything is not perfect, you can find return and exchange information in your account or by contacting our support team.
        </p>

        <div style="margin:14px 0 18px; padding:12px 14px; background:#f9fafb; border-radius:10px; border:1px solid #e5e7eb;">
          <p style="margin:0; font-size:13px;">
            <strong>Order:</strong> #${orderIdShort}
          </p>
        </div>

        <p style="margin-top:16px; font-size:12px; color:#4b5563;">
          View your order and details:
        </p>
        <p style="margin-top:4px;">
          <a href="${storeUrl}/account?tab=orders" style="font-size:12px; text-decoration:none; padding:9px 16px; border-radius:999px; background:#111827; color:white; letter-spacing:0.16em; text-transform:uppercase; display:inline-block;">
            View Order
          </a>
        </p>
      </div>
    </div>
  `;

  return safeSendMail({
    from: process.env.EMAIL_FROM,
    to: order.customerInfo.email,
    replyTo: process.env.SUPPORT_EMAIL || "samistore.support@gmail.com",
    subject,
    html,
  });
};

module.exports = {
  sendOrderConfirmationEmail,
  sendAdminNewOrderNotificationEmail,
  sendShippingEmail,
  sendDeliveryEmail,
};

