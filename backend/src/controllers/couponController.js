const Coupon = require("../models/Coupon");

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const discountPercentage = Number(req.body?.discountPercentage || 0);
    const expiresAt = new Date(req.body?.expiresAt);

    if (!code || !discountPercentage || Number.isNaN(expiresAt.getTime())) {
      return res.status(400).json({ message: "Invalid coupon data" });
    }

    const coupon = await Coupon.create({ code, discountPercentage, expiresAt });
    res.status(201).json(coupon);
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const payload = {};
    if (req.body?.code) payload.code = String(req.body.code).trim().toUpperCase();
    if (req.body?.discountPercentage !== undefined) {
      payload.discountPercentage = Number(req.body.discountPercentage);
    }
    if (req.body?.expiresAt) payload.expiresAt = new Date(req.body.expiresAt);
    if (req.body?.isActive !== undefined) payload.isActive = Boolean(req.body.isActive);

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    res.status(200).json(coupon);
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    await coupon.deleteOne();
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const validateCoupon = async (req, res, next) => {
  try {
    const code = String(req.params.code || "").trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ valid: false, message: "No code provided" });
    }
    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) {
      return res.status(200).json({ valid: false, message: "Invalid coupon code" });
    }
    if (new Date(coupon.expiresAt) < new Date()) {
      return res.status(200).json({ valid: false, message: "Coupon has expired" });
    }
    return res.status(200).json({ valid: true, discountPercentage: coupon.discountPercentage, code: coupon.code });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
};
