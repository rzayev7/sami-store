const Order = require("../models/Order");
const { EpointService } = require("../services/epointService");
const { verifySignature, decodeData } = require("../utils/epointSignature");
const { sendWhatsAppOrderNotification } = require("../services/whatsappService");
const {
  sendOrderConfirmationEmail,
  sendAdminNewOrderNotificationEmail,
} = require("../services/emailService");

const epointService = new EpointService();

const getStoreBaseUrl = () => (process.env.STORE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const getApiBaseUrl = () =>
  (process.env.BACKEND_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");
const isLocalhostUrl = (value) => {
  try {
    const u = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(String(u.hostname || "").toLowerCase());
  } catch {
    return false;
  }
};

const buildUrl = (base, path, query = {}) => {
  const url = new URL(path, `${base}/`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const mapEpointStatus = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success") return { status: "paid", paymentStatus: "paid" };
  if (normalized === "returned") return { status: "cancelled", paymentStatus: "refunded" };
  if (["failed", "error", "server_error"].includes(normalized)) {
    return { status: "failed", paymentStatus: "failed" };
  }
  return { status: "pending", paymentStatus: "pending" };
};

const getOrderAmountAzn = (order) => {
  // Checkout totals are already stored in AZN, despite the legacy field name `totalPriceUSD`.
  const amountAzn = Math.round(Number(order?.totalPriceUSD || 0) * 100) / 100;
  if (!amountAzn || amountAzn <= 0) {
    throw new Error(`Order ${order._id} has no valid stored total amount`);
  }
  if (amountAzn < 0.5) {
    throw new Error(`Order amount ${amountAzn} is below Epoint minimum (0.50 AZN)`);
  }
  return amountAzn;
};

const upsertPaymentTimeline = (order, event, note = "") => {
  order.timeline = order.timeline || [];
  order.timeline.push({ event, timestamp: new Date(), note });
};

const applyGatewayResultToOrder = async (order, gatewayData) => {
  const wasPaid = order.paymentStatus === "paid";
  const mapped = mapEpointStatus(gatewayData?.status);
  const bankCode = String(gatewayData?.code || "");
  const bankCodeMessage = epointService.describeBankCode(bankCode);

  order.status = mapped.status;
  order.paymentStatus = mapped.paymentStatus;
  order.paymentMethod = "card";
  order.paymentGateway = {
    ...(order.paymentGateway || {}),
    provider: "epoint",
    mode: process.env.NODE_ENV || "production",
    orderId: String(gatewayData?.order_id || order._id),
    sessionId: String(gatewayData?.transaction || ""),
    paymentUrl: String(order?.paymentGateway?.paymentUrl || ""),
    rawStatus: String(gatewayData?.status || ""),
    rawResponse: gatewayData,
    lastCheckedAt: new Date(),
    ...(mapped.paymentStatus === "paid" ? { verifiedAt: new Date() } : {}),
  };

  upsertPaymentTimeline(
    order,
    mapped.paymentStatus === "paid" ? "payment_confirmed" : "payment_verification_checked",
    bankCode ? `${bankCode}: ${bankCodeMessage}` : String(gatewayData?.message || ""),
  );

  await order.save();

  // Card orders should send confirmation/alerts only after gateway confirms payment.
  if (!wasPaid && mapped.paymentStatus === "paid") {
    try {
      const whatsappResult = await sendWhatsAppOrderNotification(order);
      if (!whatsappResult.sent) {
        console.warn("WhatsApp order notification was not sent:", whatsappResult.reason);
      }
    } catch (err) {
      console.warn("Failed to send WhatsApp order notification:", err?.message || err);
    }

    try {
      const emailResult = await sendOrderConfirmationEmail(order);
      if (!emailResult.sent) {
        console.warn("Order confirmation email was not sent:", emailResult.reason);
      }
    } catch (err) {
      console.warn("Failed to send order confirmation email:", err?.message || err);
    }

    try {
      const adminEmailResult = await sendAdminNewOrderNotificationEmail(order);
      if (!adminEmailResult.sent) {
        console.warn("Admin order notification email was not sent:", adminEmailResult.reason);
      }
    } catch (err) {
      console.warn("Failed to send admin order notification email:", err?.message || err);
    }
  }

  return mapped;
};

const initiateEpointPayment = async (req, res, next) => {
  try {
    const apiBase = getApiBaseUrl();
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && isLocalhostUrl(apiBase)) {
      return res.status(500).json({
        message:
          "BACKEND_BASE_URL must be a public HTTPS URL in production. Current value resolves to localhost.",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus === "paid") return res.status(400).json({ message: "Order is already paid" });

    const amount = getOrderAmountAzn(order);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid order amount" });
    }

    const successRedirectUrl = buildUrl(apiBase, process.env.EPOINT_SUCCESS_PATH || "/api/payments/epoint/return/success", {
      orderId: order._id,
    });
    const errorRedirectUrl = buildUrl(apiBase, process.env.EPOINT_ERROR_PATH || "/api/payments/epoint/return/error", {
      orderId: order._id,
    });

    const response = await epointService.initiatePayment({
      amount,
      orderId: String(order._id),
      description: `Sami order ${order._id}`,
      language: String(order?.customerLocale?.language || process.env.EPOINT_LANGUAGE || "en").toLowerCase(),
      successRedirectUrl,
      errorRedirectUrl,
    });

    if (response?.status !== "success" || !response?.redirect_url) {
      return res.status(502).json({ message: "Unexpected Epoint initiate response", details: response });
    }

    order.status = "pending";
    order.paymentStatus = "pending";
    order.paymentMethod = "card";
    order.paymentGateway = {
      provider: "epoint",
      mode: process.env.NODE_ENV || "production",
      orderId: String(order._id),
      sessionId: String(response?.transaction || ""),
      paymentUrl: String(response.redirect_url),
      rawStatus: String(response?.status || "new"),
      rawResponse: response,
      lastCheckedAt: new Date(),
    };
    upsertPaymentTimeline(order, "payment_initialized", String(response?.transaction || ""));
    await order.save();

    return res.status(200).json({
      orderId: order._id,
      paymentUrl: response.redirect_url,
      transaction: response?.transaction || "",
      gateway: { provider: "epoint", status: response?.status || "new" },
    });
  } catch (error) {
    return next(error);
  }
};

const verifyEpointOrderPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const transaction = String(order?.paymentGateway?.sessionId || "");
    if (!transaction) {
      return res.status(400).json({ message: "Missing Epoint transaction for this order" });
    }

    const result = await epointService.checkStatus({ transaction });
    await applyGatewayResultToOrder(order, result);

    return res.status(200).json({
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      gatewayStatus: result?.status || "",
      code: result?.code || "",
      codeDescription: epointService.describeBankCode(result?.code),
    });
  } catch (error) {
    return next(error);
  }
};

const epointCallback = async (req, res, next) => {
  try {
    const { data, signature } = req.body || {};
    if (!data || !signature) {
      return res.status(400).json({ message: "Missing callback data or signature" });
    }

    const isValid = verifySignature({
      data,
      signature,
      privateKey: process.env.EPOINT_PRIVATE_KEY,
    });
    if (!isValid) {
      return res.status(401).json({ message: "Invalid callback signature" });
    }

    const payload = decodeData(data);
    const orderId = String(payload?.order_id || "");
    if (!orderId) return res.status(400).json({ message: "Missing order_id in callback payload" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus === "paid") {
      return res.status(200).json({ ok: true, message: "Already processed" });
    }

    await applyGatewayResultToOrder(order, payload);

    return res.status(200).json({
      ok: true,
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      transaction: payload?.transaction || "",
      rrn: payload?.rrn || "",
      cardMask: payload?.card_mask || "",
    });
  } catch (error) {
    return next(error);
  }
};

const epointReturn = async (req, res, next) => {
  try {
    const order = await Order.findById(req.query.orderId);
    if (!order) return res.status(404).send("Order not found");

    const transaction = String(order?.paymentGateway?.sessionId || "");
    if (!transaction) {
      return res.status(400).send("Missing Epoint transaction");
    }

    const result = await epointService.checkStatus({ transaction });
    await applyGatewayResultToOrder(order, result);

    const storeBase = getStoreBaseUrl();
    const target =
      order.paymentStatus === "paid"
        ? buildUrl(storeBase, "/order-success", { orderId: order._id, email: order.customerInfo?.email || "" })
        : buildUrl(storeBase, "/checkout", { orderId: order._id, payment: order.paymentStatus });

    return res.redirect(302, target);
  } catch (error) {
    return next(error);
  }
};

const refundEpointPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const transaction = String(req.body?.transaction || order?.paymentGateway?.sessionId || "");
    if (!transaction) {
      return res.status(400).json({ message: "transaction is required for reverse request" });
    }

    const amountRaw = req.body?.amount;
    const result = await epointService.reverse({
      transaction,
      ...(amountRaw != null && amountRaw !== "" ? { amount: Number(amountRaw) } : {}),
    });

    const statusText = String(result?.status || "").toLowerCase();
    if (statusText === "success") {
      order.status = "cancelled";
      order.paymentStatus = "refunded";
      order.paymentGateway = {
        ...(order.paymentGateway || {}),
        rawStatus: "returned",
        rawResponse: {
          ...(order?.paymentGateway?.rawResponse || {}),
          reverse: result,
        },
        lastCheckedAt: new Date(),
      };
      upsertPaymentTimeline(order, "payment_refunded", String(result?.message || ""));
      await order.save();
    }

    return res.status(200).json({
      orderId: order._id,
      status: result?.status || "",
      message: result?.message || "",
      transaction: result?.transaction || transaction,
    });
  } catch (error) {
    return next(error);
  }
};

const payoutToSavedCard = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const cardId = String(req.body?.cardId || order?.paymentGateway?.rawResponse?.card_id || "");
    if (!cardId) return res.status(400).json({ message: "cardId is required for disbursement request" });

    const amount = Number(req.body?.amount || getOrderAmountAzn(order));
    const result = await epointService.refund({
      cardId,
      orderId: String(order._id),
      amount,
    });

    return res.status(200).json({
      orderId: order._id,
      status: result?.status || "",
      message: result?.message || "",
      transaction: result?.transaction || "",
    });
  } catch (error) {
    return next(error);
  }
};

const chargeSavedCard = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const cardId = String(req.body?.cardId || "");
    if (!cardId) return res.status(400).json({ message: "cardId is required" });

    const amount = Number(req.body?.amount || getOrderAmountAzn(order));
    const result = await epointService.chargeCard({
      cardId,
      orderId: String(order._id),
      amount,
      description: `Saved card charge for order ${order._id}`,
    });

    await applyGatewayResultToOrder(order, {
      ...result,
      order_id: String(order._id),
    });

    return res.status(200).json({
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      transaction: result?.transaction || "",
      code: result?.code || "",
      codeDescription: epointService.describeBankCode(result?.code),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  initiateEpointPayment,
  verifyEpointOrderPayment,
  epointCallback,
  epointReturn,
  refundEpointPayment,
  payoutToSavedCard,
  chargeSavedCard,
};
