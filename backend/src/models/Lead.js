const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    whatsapp: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      trim: true,
      default: "popup",
      maxlength: 40,
    },
    language: {
      type: String,
      trim: true,
      lowercase: true,
      default: "en",
      maxlength: 5,
    },
    country: {
      type: String,
      trim: true,
      default: "",
      maxlength: 60,
    },
    page: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },
  },
  { timestamps: true }
);

// At least one contact method is required (validated at controller level).
leadSchema.index({ email: 1 }, { sparse: true });
leadSchema.index({ whatsapp: 1 }, { sparse: true });

module.exports = mongoose.model("Lead", leadSchema);
