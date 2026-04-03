const express = require("express");
const {
  getDashboardStats,
  getCustomersSummary,
  getSalesAnalytics,
} = require("../controllers/adminDashboardController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(protectAdmin);
router.get("/dashboard-stats", getDashboardStats);
router.get("/customers", getCustomersSummary);
router.get("/analytics", getSalesAnalytics);

module.exports = router;
