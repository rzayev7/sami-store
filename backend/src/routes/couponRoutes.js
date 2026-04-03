const express = require("express");
const {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require("../controllers/couponController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/validate/:code", validateCoupon);
router.use(protectAdmin);
router.get("/", getCoupons);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

module.exports = router;
