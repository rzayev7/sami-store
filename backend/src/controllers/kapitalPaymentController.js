const Order = require("../models/Order");
const { createOrder, getOrderDetails } = require("../services/kapitalPaymentService");

const getStoreBaseUrl = () => (process.env.STORE_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const getApiBaseUrl = () =>
  (process.env.BACKEND_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");

const buildUrl = (base, path, query = {}) => {
  const url = new URL(path, `${base}/`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const parseRawGatewayStatus = (details) => {
  return String(
    details?.orderStatus ||
      details?.status ||
      details?.order?.status ||
      details?.order?.orderStatus ||
      ""
  )
    .trim()
    .toUpperCase();
};

const mapGatewayToLocalStatuses = (raw) => {
  const status = String(raw || "").toUpperCase();
  if (["FULL_PAID", "FULLY_PAID", "PAID", "CLOSED", "FUNDED"].includes(status)) {
    return { status: "paid", paymentStatus: "paid" };
  }
  if (["CANCELLED", "CANCELED", "REFUSED"].includes(status)) {
    return { status: "cancelled", paymentStatus: "failed" };
  }
  if (["REJECTED", "DECLINED", "EXPIRED", "VOIDED"].includes(status)) {
    return { status: "failed", paymentStatus: "failed" };
  }
  return { status: "pending", paymentStatus: "pending" };
};

const verifyAndUpdateOrderPayment = async (order) => {
  const gatewayOrderId = order?.paymentGateway?.orderId;
  if (!gatewayOrderId) {
    throw new Error("Payment is not initialized for this order");
  }

  const details = await getOrderDetails(gatewayOrderId);
  const rawStatus = parseRawGatewayStatus(details);
  const mapped = mapGatewayToLocalStatuses(rawStatus);

  order.status = mapped.status;
  order.paymentStatus = mapped.paymentStatus;
  order.paymentMethod = "kapital_bank";
  order.paymentGateway = {
    ...(order.paymentGateway || {}),
    provider: "kapital_bank",
    mode: "test",
    rawStatus,
    rawResponse: details,
    lastCheckedAt: new Date(),
    ...(mapped.paymentStatus === "paid" ? { verifiedAt: new Date() } : {}),
  };
  order.timeline = order.timeline || [];
  order.timeline.push({
    event: mapped.paymentStatus === "paid" ? "payment_confirmed" : "payment_verification_checked",
    timestamp: new Date(),
    note: rawStatus || "UNKNOWN",
  });
  await order.save();

  return { details, rawStatus, ...mapped };
};

const initKapitalTestPayment = async (req, res, next) => {
  try {
    if (String(process.env.KAPITAL_TEST_MODE_ENABLED || "false").toLowerCase() !== "true") {
      return res.status(503).json({ message: "Kapital Bank test mode is disabled" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    const amountMinor = Math.round(Number(order.totalPriceUSD || 0) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      return res.status(400).json({ message: "Invalid order amount" });
    }

    const returnBase =
      process.env.KAPITAL_TEST_RETURN_BASE_PATH ||
      process.env.KAPITAL_TEST_RETURN_PATH ||
      "/api/payments/kapital/return";
    const returnBaseNormalized = String(returnBase).replace(/\/+$/, "");
    const callbackPath = process.env.KAPITAL_TEST_CALLBACK_PATH || "/api/payments/kapital/callback";
    const apiBaseUrl = getApiBaseUrl();
    const approveUrl = buildUrl(apiBaseUrl, `${returnBaseNormalized}/success`, { orderId: order._id });
    const declineUrl = buildUrl(apiBaseUrl, `${returnBaseNormalized}/failure`, { orderId: order._id });
    const cancelUrl = buildUrl(apiBaseUrl, `${returnBaseNormalized}/cancel`, { orderId: order._id });
    const callbackUrl = buildUrl(apiBaseUrl, callbackPath, { orderId: order._id });

    const gatewayOrder = await createOrder({
      amountMinor,
      description: `Sami order ${order._id}`,
      approveUrl,
      declineUrl,
      cancelUrl,
      callbackUrl,
    });

    const paymentUrl =
      gatewayOrder?.order?.hppUrl ||
      gatewayOrder?.hppUrl ||
      gatewayOrder?.url ||
      gatewayOrder?.paymentUrl ||
      "";
    const gatewayOrderId =
      gatewayOrder?.order?.id || gatewayOrder?.id || gatewayOrder?.orderId || "";
    const sessionId =
      gatewayOrder?.order?.password ||
      gatewayOrder?.password ||
      gatewayOrder?.sessionId ||
      "";

    if (!paymentUrl || !gatewayOrderId) {
      return res.status(502).json({
        message: "Unexpected Kapital create-order response",
        details: gatewayOrder,
      });
    }

    order.status = "pending";
    order.paymentStatus = "pending";
    order.paymentMethod = "kapital_bank";
    order.paymentGateway = {
      provider: "kapital_bank",
      mode: "test",
      orderId: String(gatewayOrderId),
      sessionId: String(sessionId || ""),
      paymentUrl: String(paymentUrl),
      rawStatus: String(gatewayOrder?.order?.status || gatewayOrder?.status || "PREPARING"),
      rawResponse: gatewayOrder,
      lastCheckedAt: new Date(),
    };
    order.timeline = order.timeline || [];
    order.timeline.push({
      event: "payment_initialized",
      timestamp: new Date(),
      note: String(gatewayOrderId),
    });
    await order.save();

    res.status(200).json({
      orderId: order._id,
      paymentUrl,
      gateway: {
        provider: "kapital_bank",
        mode: "test",
        orderId: gatewayOrderId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const kapitalReturn = async (req, res, next) => {
  try {
    const order = await Order.findById(req.query.orderId);
    if (!order) return res.status(404).send("Order not found");

    const result = await verifyAndUpdateOrderPayment(order);
    const storeBaseUrl = getStoreBaseUrl();
    const target =
      result.paymentStatus === "paid"
        ? buildUrl(storeBaseUrl, "/order-success", {
            orderId: order._id,
            email: order.customerInfo?.email || "",
            payment: "paid",
          })
        : buildUrl(storeBaseUrl, "/checkout", {
            orderId: order._id,
            payment: result.status,
          });

    return res.redirect(302, target);
  } catch (error) {
    next(error);
  }
};

const kapitalCallback = async (req, res, next) => {
  try {
    const orderId = req.query.orderId || req.body?.orderId;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const result = await verifyAndUpdateOrderPayment(order);
    return res.status(200).json({
      ok: true,
      orderId: order._id,
      status: result.status,
      paymentStatus: result.paymentStatus,
      gatewayStatus: result.rawStatus,
    });
  } catch (error) {
    next(error);
  }
};

const verifyKapitalOrderPayment = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const result = await verifyAndUpdateOrderPayment(order);
    res.status(200).json({
      orderId: order._id,
      status: result.status,
      paymentStatus: result.paymentStatus,
      gatewayStatus: result.rawStatus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initKapitalTestPayment,
  kapitalReturn,
  kapitalCallback,
  verifyKapitalOrderPayment,
};
