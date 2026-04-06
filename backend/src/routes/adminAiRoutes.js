const express = require("express");
const { aiProductFill } = require("../controllers/adminAiProductFillController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(protectAdmin);
router.post("/ai-product-fill", aiProductFill);

module.exports = router;
