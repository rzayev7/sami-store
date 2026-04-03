const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  getCustomerStats,
} = require("../controllers/orderController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/", createOrder);
router.get("/", protectAdmin, getOrders);
router.get("/customer-stats/:email", protectAdmin, getCustomerStats);
// Public/role-aware access; controller sanitizes response for guests.
router.get("/:id", getOrderById);
router.put("/:id", protectAdmin, updateOrder);

module.exports = router;
