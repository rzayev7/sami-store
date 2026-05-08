const express = require("express");
const { createLead, getLeads, exportLeadsCsv } = require("../controllers/leadController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/", createLead);

router.use(protectAdmin);
router.get("/", getLeads);
router.get("/export.csv", exportLeadsCsv);

module.exports = router;
