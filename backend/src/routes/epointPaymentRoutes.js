const express = require("express");
const {
  initiateEpointPayment,
  verifyEpointOrderPayment,
  epointCallback,
  epointReturn,
  refundEpointPayment,
  payoutToSavedCard,
  chargeSavedCard,
} = require("../controllers/epointPaymentController");

const router = express.Router();

router.post("/init/:id", initiateEpointPayment);
router.get("/verify/:id", verifyEpointOrderPayment);
router.post("/callback", epointCallback);
router.get("/return/success", epointReturn);
router.get("/return/error", epointReturn);
router.post("/refund/:id", refundEpointPayment);
router.post("/payout/:id", payoutToSavedCard);
router.post("/charge-card/:id", chargeSavedCard);

module.exports = router;
