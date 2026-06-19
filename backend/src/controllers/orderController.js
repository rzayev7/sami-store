const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { deductStockForPaidOrder } = require("../services/orderStockService");
const { sendWhatsAppOrderNotification } = require("../services/whatsappService");
const {
  sendOrderConfirmationEmail,
  sendAdminNewOrderNotificationEmail,
  sendShippingEmail,
  sendDeliveryEmail,
} = require("../services/emailService");
const AZERPOST_TRACKING_URL = "https://www.azerpost.az/en/services/tracking-of-shipments";
const ALLOWED_PAYMENT_METHODS = ["card", "western_union", "zolotaya_korona", "cod", "other", ""];

const extractCustomerId = (req) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === "customer" ? decoded.id : null;
  } catch {
    return null;
  }
};

const buildValidatedOrderPayload = async ({ body = {}, customerId = null, timelineEvent = "order_created" }) => {
  const rawItems = Array.isArray(body?.items) ? body.items : [];
  const customerInfo = body?.customerInfo || {};
  const rawLocale = body?.customerLocale || {};

  if (rawItems.length === 0) {
    return { error: { status: 400, message: "Cart is empty" } };
  }

  const requiredCustomerFields = ["name", "email", "phone", "country", "address", "postalCode"];
  const missingField = requiredCustomerFields.find((field) => !String(customerInfo?.[field] || "").trim());
  if (missingField) {
    return { error: { status: 400, message: `Missing required field: ${missingField}` } };
  }

  const productIds = rawItems.map((i) => i?.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const verifiedItems = [];
  for (const item of rawItems) {
    const pid = String(item?.productId || "");
    const product = productMap.get(pid);
    if (!product) {
      return { error: { status: 400, message: `Product ${pid} not found` } };
    }

    const qty = Math.max(1, Math.trunc(Number(item?.quantity || 1)));
    const hasDiscount =
      product.discountPriceUSD != null &&
      Number(product.discountPriceUSD) > 0 &&
      Number(product.discountPriceUSD) < Number(product.priceUSD);
    const serverPrice = hasDiscount ? Number(product.discountPriceUSD) : Number(product.priceUSD);

    verifiedItems.push({
      productId: pid,
      code: product.code || "",
      name: product.name,
      priceUSD: serverPrice,
      quantity: qty,
      size: item?.size || "",
      color: item?.color || "",
      image: item?.image || product.images?.[0] || "",
    });
  }

  const subtotal = verifiedItems.reduce((sum, i) => sum + i.priceUSD * i.quantity, 0);

  let discountAmount = 0;
  let couponCode = null;
  if (body?.couponCode) {
    const code = String(body.couponCode).trim().toUpperCase();
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (coupon && new Date(coupon.expiresAt) >= new Date()) {
      discountAmount = (subtotal * coupon.discountPercentage) / 100;
      couponCode = coupon.code;
    }
  }

  const shippingCost = Math.max(0, Number(body?.shippingCost || 0));
  const serverTotal = Math.round((subtotal - discountAmount + shippingCost) * 100) / 100;

  const normalizedPaymentMethod = String(body?.paymentMethod || "").toLowerCase();
  if (!ALLOWED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
    return { error: { status: 400, message: "Invalid payment method" } };
  }

  const payload = {
    ...(customerId && { customerId }),
    customerInfo,
    customerLocale: {
      language: String(rawLocale.language || "en").toLowerCase(),
      currency: String(rawLocale.currency || "USD").toUpperCase(),
      currencyRate: Math.max(0, Number(rawLocale.currencyRate || 0)),
      aznPerUsd: Math.max(0, Number(rawLocale.aznPerUsd || 1.7)),
    },
    items: verifiedItems,
    totalPriceUSD: serverTotal,
    shippingCost,
    paymentStatus: "pending",
    paymentMethod: normalizedPaymentMethod,
    ...(couponCode && { couponCode }),
    ...(body?.orderNotes != null &&
      String(body.orderNotes).trim() && {
        orderNotes: String(body.orderNotes).trim(),
      }),
    timeline: [{ event: timelineEvent, timestamp: new Date() }],
  };

  return { payload };
};

const createOrder = async (req, res, next) => {
  try {
    const customerId = extractCustomerId(req);
    const { payload, error } = await buildValidatedOrderPayload({
      body: req.body,
      customerId,
      timelineEvent: "order_created",
    });
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const order = await Order.create(payload);

    console.log(`[createOrder] orderId=${order._id} paymentMethod="${order.paymentMethod}"`);

    // Send confirmation notifications immediately for orders that do not require
    // external gateway confirmation (bank transfer / cash on delivery / manual payments).
    const shouldNotifyOnCreate = order.paymentMethod !== "card";
    if (shouldNotifyOnCreate) {
      const whatsappResult = await sendWhatsAppOrderNotification(order);
      if (!whatsappResult.sent) {
        console.warn("WhatsApp order notification was not sent:", whatsappResult.reason);
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

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const createAdminManualOrder = async (req, res, next) => {
  try {
    const { payload, error } = await buildValidatedOrderPayload({
      body: req.body,
      customerId: null,
      timelineEvent: "manual_order_created_by_admin",
    });
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const order = await Order.create(payload);
    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
};

const createAdminQuickOrder = async (req, res, next) => {
  try {
    const amount = Math.round(Number(req.body?.amount || 0) * 100) / 100;
    if (!Number.isFinite(amount) || amount < 0.5) {
      return res.status(400).json({ message: "Amount must be at least 0.50 AZN" });
    }

    const customerName = String(req.body?.customerName || "").trim() || "Quick payment";
    const email = String(req.body?.email || "").trim() || "manual@sami.store";
    const phone = String(req.body?.phone || "").trim() || "-";
    const note = String(req.body?.orderNotes || "").trim();

    const order = await Order.create({
      customerInfo: {
        name: customerName,
        email,
        phone,
        country: "-",
        address: "-",
        city: "-",
        postalCode: "-",
      },
      items: [],
      totalPriceUSD: amount,
      shippingCost: 0,
      paymentStatus: "pending",
      paymentMethod: "card",
      ...(note && { orderNotes: note }),
      timeline: [{ event: "quick_payment_link_created_by_admin", timestamp: new Date() }],
    });

    return res.status(201).json(order);
  } catch (error) {
    return next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    }

    // Determine requester role (if any) from bearer token.
    let role = null;
    let requesterId = null;
    try {
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        role = decoded.role || null;
        requesterId = decoded.id || null;
      }
    } catch {
      // ignore token errors for public access
    }

    const isAdmin = role === "admin";
    const isOwnCustomer =
      role === "customer" && requesterId && String(order.customerId || "") === String(requesterId);

    const emailQuery = String(req.query.email || "").trim().toLowerCase();
    const orderEmail = String(order.customerInfo?.email || "").trim().toLowerCase();
    const emailMatches = emailQuery && orderEmail && emailQuery === orderEmail;

    if (!isAdmin && !isOwnCustomer && !emailMatches) {
      // Public / guest access (e.g. /track-order): return only non-sensitive fields.
      const publicOrder = {
        _id: order._id,
        status: order.status,
        trackingNumber: order.trackingNumber || "",
        trackingUrl: order.trackingUrl || "",
        createdAt: order.createdAt,
        customerInfo: {
          country: order.customerInfo?.country || "",
        },
      };
      return res.status(200).json(publicOrder);
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

const TIMELINE_EVENTS = {
  paid: "payment_confirmed",
  failed: "payment_failed",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

const updateOrder = async (req, res, next) => {
  try {
    const allowedStatuses = ["pending", "paid", "failed", "shipped", "delivered", "cancelled"];
    const allowedPaymentStatuses = ["pending", "paid", "failed", "refunded"];
    const nextStatus = String(req.body?.status || "").toLowerCase();
    const nextPaymentStatus = String(req.body?.paymentStatus || "").toLowerCase();

    if (nextStatus && !allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    if (nextPaymentStatus && !allowedPaymentStatuses.includes(nextPaymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const trackingNumber = req.body?.trackingNumber;
    const paymentMethod = req.body?.paymentMethod;
    const note = req.body?.note;

    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = existingOrder.status;
    const previousPaymentStatus = existingOrder.paymentStatus;
    const previousTracking = existingOrder.trackingNumber;

    const timelineEntries = [];

    if (nextStatus) {
      existingOrder.status = nextStatus;
      const eventName = TIMELINE_EVENTS[nextStatus] || `status_${nextStatus}`;
      timelineEntries.push({
        event: eventName,
        timestamp: new Date(),
        note: note || "",
      });
    }
    if (nextPaymentStatus) {
      existingOrder.paymentStatus = nextPaymentStatus;
    }
    if (trackingNumber !== undefined) {
      const trimmed = String(trackingNumber).trim();
      existingOrder.trackingNumber = trimmed;
      existingOrder.trackingUrl = trimmed ? AZERPOST_TRACKING_URL : "";
      timelineEntries.push({
        event: "tracking_added",
        timestamp: new Date(),
        note: trimmed,
      });
    }
    if (paymentMethod !== undefined) {
      const normalizedPaymentMethod = String(paymentMethod).toLowerCase();
      if (!ALLOWED_PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
        return res.status(400).json({ message: "Invalid payment method" });
      }
      existingOrder.paymentMethod = normalizedPaymentMethod;
    }

    if (timelineEntries.length > 0) {
      existingOrder.timeline = existingOrder.timeline || [];
      existingOrder.timeline.push(...timelineEntries);
    }

    const willBeShipped =
      nextStatus === "shipped" && (existingOrder.trackingNumber || trackingNumber);
    const willBeDelivered = nextStatus === "delivered";
    const trackingJustAdded = !previousTracking && existingOrder.trackingNumber;
    const shouldSendShippingEmail = (willBeShipped && previousStatus !== "shipped") || trackingJustAdded;
    const paymentJustConfirmed =
      previousPaymentStatus !== "paid" && (nextPaymentStatus === "paid" || nextStatus === "paid");

    // Nothing to update
    if (
      !willBeShipped &&
      !willBeDelivered &&
      !trackingJustAdded &&
      !paymentJustConfirmed &&
      !nextStatus &&
      !nextPaymentStatus &&
      trackingNumber === undefined &&
      paymentMethod === undefined
    ) {
      return res.status(400).json({ message: "No fields to update" });
    }

    if (paymentJustConfirmed && !existingOrder.stockDeductedAt) {
      existingOrder.paymentStatus = "paid";
      await deductStockForPaidOrder(existingOrder);
    }

    const order = await existingOrder.save();

    // Trigger professional emails based on transitions
    try {
      if (shouldSendShippingEmail) {
        const emailResult = await sendShippingEmail(order);
        if (!emailResult.sent) {
          console.warn("Shipping email was not sent:", emailResult.reason);
        }
      }

      if (willBeDelivered && previousStatus !== "delivered") {
        const emailResult = await sendDeliveryEmail(order);
        if (!emailResult.sent) {
          console.warn("Delivery email was not sent:", emailResult.reason);
        }
      }
    } catch (err) {
      console.warn("Failed to send status email:", err?.message || err);
    }

    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

const getCustomerStats = async (req, res, next) => {
  try {
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const orders = await Order.find({ "customerInfo.email": email });
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalPriceUSD || 0), 0);

    res.status(200).json({ totalOrders, totalSpent });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  createAdminManualOrder,
  createAdminQuickOrder,
  getOrders,
  getOrderById,
  updateOrder,
  getCustomerStats,
};
