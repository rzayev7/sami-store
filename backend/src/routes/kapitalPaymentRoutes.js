const express = require("express");
const {
  initKapitalTestPayment,
  kapitalReturn,
  kapitalCallback,
  verifyKapitalOrderPayment,
} = require("../controllers/kapitalPaymentController");

const router = express.Router();

router.post("/init/:id", initKapitalTestPayment);
router.get("/verify/:id", verifyKapitalOrderPayment);
router.get("/return/success", kapitalReturn);
router.get("/return/failure", kapitalReturn);
router.get("/return/cancel", kapitalReturn);
router.get("/return", kapitalReturn);
router.post("/callback", kapitalCallback);
router.get("/callback", kapitalCallback);

module.exports = router;
