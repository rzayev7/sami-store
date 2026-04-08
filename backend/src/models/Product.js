const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  /** Optional fabric / care line (e.g. from AI or manual). Shown on PDP Fabric & care. */
  fabricCare: {
    type: String,
    default: "",
  },
  priceUSD: {
    type: Number,
    required: true,
  },
  discountPriceUSD: {
    type: Number,
    default: null,
  },
  allowSeparatePurchase: {
    type: Boolean,
    default: false,
  },
  bundleFullSetPriceUSD: {
    type: Number,
    default: null,
  },
  bundleTopPriceUSD: {
    type: Number,
    default: null,
  },
  bundleBottomPriceUSD: {
    type: Number,
    default: null,
  },
  category: {
    type: String,
    required: true,
  },
  sizes: [
    {
      type: String,
    },
  ],
  colors: [
    {
      type: String,
    },
  ],
  images: [
    {
      type: String,
    },
  ],
  /** Optional short loop video for listing / product cards (Cloudinary URL). */
  cardVideoUrl: {
    type: String,
    default: null,
  },
  cardVideoAdjustments: {
    brightness: { type: Number, default: 100 },
    contrast: { type: Number, default: 100 },
    saturation: { type: Number, default: 100 },
  },
  /** If true, card video is intentionally landscape — skip client rotate-to-cover fix for portrait grids. */
  cardVideoLandscape: {
    type: Boolean,
    default: false,
  },
  stock: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  isBestSeller: {
    type: Boolean,
    default: false,
  },
  isNewArrival: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isBestSeller: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
