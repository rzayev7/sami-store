const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Product = require("../models/Product");
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

    const payload = {
      ...(customerId && { customerId }),
      customerInfo: req.body?.customerInfo || {},
      items: Array.isArray(req.body?.items)
        ? req.body.items.map((item) => ({
            productId: item?.productId ? String(item.productId) : "",
            code: item?.code || "",
            name: item?.name || "",
            priceUSD: Number(item?.priceUSD || 0),
            quantity: Number(item?.quantity || 0),
            size: item?.size || "",
            color: item?.color || "",
            image: item?.image || "",
          }))
        : [],
      totalPriceUSD: Number(req.body?.totalPriceUSD || 0),
      shippingCost: Number(req.body?.shippingCost || 0),
      paymentStatus: String(req.body?.paymentStatus || "pending").toLowerCase(),
      paymentMethod: String(req.body?.paymentMethod || "").toLowerCase(),
      ...(req.body?.couponCode && { couponCode: String(req.body.couponCode).trim() }),
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

    // Fire-and-forget style order confirmation email; do not block the response.
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

    if (paymentJustConfirmed && Array.isArray(existingOrder.items)) {
      for (const item of existingOrder.items) {
        const productId = item?.productId;
        const quantity = Number(item?.quantity || 0);

        if (!productId || quantity <= 0) continue;

        try {
          const result = await Product.updateOne(
            { _id: productId, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } }
          );

          if (result.matchedCount === 0) {
            console.warn(
              `Skipping stock decrement for product ${productId}: insufficient stock or product not found`
            );
          }
        } catch (err) {
          console.warn(
            `Failed to decrement stock for product ${productId} on payment confirmation:`,
            err?.message || err
          );
        }
      }
    }

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
