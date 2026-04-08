const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const { sendWhatsAppOrderNotification } = require("../services/whatsappService");
const {
  sendOrderConfirmationEmail,
  sendShippingEmail,
  sendDeliveryEmail,
} = require("../services/emailService");

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

const createOrder = async (req, res, next) => {
  try {
    const customerId = extractCustomerId(req);
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

    if (rawItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // ── 1. Re-read prices from database (never trust the client) ──

    const productIds = rawItems
      .map((i) => i?.productId)
      .filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const verifiedItems = [];
    for (const item of rawItems) {
      const pid = String(item?.productId || "");
      const product = productMap.get(pid);
      if (!product) {
        return res.status(400).json({ message: `Product ${pid} not found` });
      }

      const qty = Math.max(1, Math.trunc(Number(item?.quantity || 1)));

      const hasDiscount =
        product.discountPriceUSD != null &&
        Number(product.discountPriceUSD) > 0 &&
        Number(product.discountPriceUSD) < Number(product.priceUSD);
      const serverPrice = hasDiscount
        ? Number(product.discountPriceUSD)
        : Number(product.priceUSD);

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

    // ── 2. Atomic stock check & decrement ──

    const stockRollbacks = [];
    for (const item of verifiedItems) {
      const result = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
      );
      if (result.matchedCount === 0) {
        // Rollback stock for items already decremented in this request
        for (const rb of stockRollbacks) {
          await Product.updateOne(
            { _id: rb.productId },
            { $inc: { stock: rb.quantity } },
          );
        }
        return res.status(400).json({
          message: `"${item.name}" is out of stock or insufficient quantity available`,
        });
      }
      stockRollbacks.push({ productId: item.productId, quantity: item.quantity });
    }

    // ── 3. Re-validate coupon & compute total server-side ──

    const subtotal = verifiedItems.reduce(
      (sum, i) => sum + i.priceUSD * i.quantity,
      0,
    );

    let discountAmount = 0;
    let couponCode = null;
    if (req.body?.couponCode) {
      const code = String(req.body.couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code, isActive: true });
      if (coupon && new Date(coupon.expiresAt) >= new Date()) {
        discountAmount = (subtotal * coupon.discountPercentage) / 100;
        couponCode = coupon.code;
      }
    }

    const shippingCost = Math.max(0, Number(req.body?.shippingCost || 0));
    const serverTotal =
      Math.round((subtotal - discountAmount + shippingCost) * 100) / 100;

    // ── 4. Build & persist order ──

    const payload = {
      ...(customerId && { customerId }),
      customerInfo: req.body?.customerInfo || {},
      items: verifiedItems,
      totalPriceUSD: serverTotal,
      shippingCost,
      paymentStatus: "pending",
      paymentMethod: String(req.body?.paymentMethod || "").toLowerCase(),
      ...(couponCode && { couponCode }),
      ...(req.body?.orderNotes != null &&
        String(req.body.orderNotes).trim() && {
          orderNotes: String(req.body.orderNotes).trim(),
        }),
      timeline: [{ event: "order_created", timestamp: new Date() }],
    };

    const order = await Order.create(payload);

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

    res.status(201).json(order);
  } catch (error) {
    next(error);
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
      timelineEntries.push({
        event: "tracking_added",
        timestamp: new Date(),
        note: trimmed,
      });
    }
    if (paymentMethod !== undefined) {
      existingOrder.paymentMethod = String(paymentMethod).toLowerCase();
    }

    if (timelineEntries.length > 0) {
      existingOrder.timeline = existingOrder.timeline || [];
      existingOrder.timeline.push(...timelineEntries);
    }

    const willBeShipped =
      nextStatus === "shipped" && (existingOrder.trackingNumber || trackingNumber);
    const willBeDelivered = nextStatus === "delivered";
    const trackingJustAdded = !previousTracking && existingOrder.trackingNumber;
    const paymentJustConfirmed =
      previousPaymentStatus !== "paid" && nextPaymentStatus === "paid";

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

    // Stock is already decremented atomically at order creation time.
    // No second decrement here — prevents double-counting.

    const order = await existingOrder.save();

    // Trigger professional emails based on transitions
    try {
      if (willBeShipped && previousStatus !== "shipped") {
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
  getOrders,
  getOrderById,
  updateOrder,
  getCustomerStats,
};
