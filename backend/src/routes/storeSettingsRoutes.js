const express = require("express");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");
const {
  getStoreSettings,
  updateStoreSettings,
} = require("../controllers/storeSettingsController");

const router = express.Router();

router.get("/", getStoreSettings);
router.put("/", protectAdmin, updateStoreSettings);

module.exports = router;
