const Customer = require("../models/Customer");

// 1 USD spent = 1 point
const POINTS_PER_USD = 1;
// 100 points = $5 discount
const POINTS_PER_DOLLAR_REDEEM = 20; // 20 points = $1
const MIN_REDEEM = 100; // minimum points to redeem at once

/**
 * Award loyalty points to the customer after a paid order.
 * Idempotent — skips if order.pointsEarned > 0 already.
 */
const awardPointsForOrder = async (order) => {
  if (!order || order.pointsEarned > 0) return;

  const customerId = order.customerId;
  if (!customerId) return;

  const earned = Math.floor(Number(order.totalPriceUSD || 0) * POINTS_PER_USD);
  if (earned <= 0) return;

  await Customer.updateOne(
    { _id: customerId },
    { $inc: { loyaltyPoints: earned } }
  );

  order.pointsEarned = earned;
  order.timeline = order.timeline || [];
  order.timeline.push({
    event: "points_awarded",
    timestamp: new Date(),
    note: `${earned} loyalty points awarded`,
  });
};

/**
 * Redeem points for a discount. Returns the dollar discount value.
 * Throws if customer doesn't have enough points.
 */
const redeemPoints = async (customerId, pointsToRedeem) => {
  if (pointsToRedeem < MIN_REDEEM) {
    throw new Error(`Minimum ${MIN_REDEEM} points required to redeem`);
  }

  const customer = await Customer.findById(customerId);
  if (!customer) throw new Error("Customer not found");
  if (customer.loyaltyPoints < pointsToRedeem) {
    throw new Error("Insufficient points");
  }

  const discountUSD = parseFloat((pointsToRedeem / POINTS_PER_DOLLAR_REDEEM).toFixed(2));

  await Customer.updateOne(
    { _id: customerId },
    { $inc: { loyaltyPoints: -pointsToRedeem } }
  );

  return { discountUSD, pointsRedeemed: pointsToRedeem };
};

module.exports = {
  POINTS_PER_USD,
  POINTS_PER_DOLLAR_REDEEM,
  MIN_REDEEM,
  awardPointsForOrder,
  redeemPoints,
};
