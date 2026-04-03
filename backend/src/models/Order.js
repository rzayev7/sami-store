const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  customerInfo: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    taxNumber: {
      type: String,
    },
  },
  items: [
    {
      productId: {
        type: String,
      },
      code: {
        type: String,
      },
      name: {
        type: String,
      },
      priceUSD: {
        type: Number,
      },
      quantity: {
        type: Number,
      },
      size: {
        type: String,
      },
      color: {
        type: String,
      },
      image: {
        type: String,
      },
    },
  ],
  totalPriceUSD: {
    type: Number,
    required: true,
  },
  shippingCost: {
    type: Number,
    default: 0,
  },
  couponCode: {
    type: String,
    trim: true,
  },
  orderNotes: {
    type: String,
    trim: true,
    default: "",
  },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["card", "kapital_bank", "cod", "bank_transfer", "other", ""],
    default: "",
  },
  paymentGateway: {
    provider: { type: String, default: "" },
    mode: { type: String, default: "" },
    orderId: { type: String, default: "" },
    sessionId: { type: String, default: "" },
    paymentUrl: { type: String, default: "" },
    rawStatus: { type: String, default: "" },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    lastCheckedAt: { type: Date },
    verifiedAt: { type: Date },
  },
  trackingNumber: {
    type: String,
  },
  timeline: [
    {
      event: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: { type: String, default: "" },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
