/**
 * inflate-prices.js
 *
 * One-time script: marks every product as "20% off" while keeping the
 * actual amount customers pay exactly the same as before.
 *
 * How it works:
 *   effectivePrice      = discountPriceUSD (if set) OR priceUSD
 *   new priceUSD        = effectivePrice × 1.25   ← inflated "was" price (strikethrough)
 *   new discountPriceUSD = effectivePrice          ← what customer pays (unchanged)
 *
 * Run once from the backend folder:
 *   node scripts/inflate-prices.js
 *
 * The script is idempotent with the ALREADY_RUN guard below — safe to
 * run again, but it will refuse to double-inflate.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Product  = require("../src/models/Product");

const MULTIPLIER = 1.25; // 1 / (1 - 0.20)

/** Round to 2 decimal places (cents). */
function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB");

  const products = await Product.find({});
  console.log(`  Found ${products.length} products`);

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    // The actual price the customer pays right now.
    const hasDiscount =
      p.discountPriceUSD != null &&
      Number(p.discountPriceUSD) > 0 &&
      Number(p.discountPriceUSD) < Number(p.priceUSD);

    const effective = hasDiscount ? Number(p.discountPriceUSD) : Number(p.priceUSD);

    // Guard: if discountPriceUSD already equals ~80 % of priceUSD, skip —
    // this product was already inflated by this script.
    const alreadyInflated =
      hasDiscount &&
      Math.abs(Number(p.discountPriceUSD) - Number(p.priceUSD) / MULTIPLIER) < 0.02;

    if (alreadyInflated) {
      skipped++;
      continue;
    }

    const newPrice    = round2(effective * MULTIPLIER);
    const newDiscount = round2(effective);

    // Bundle prices (inflate each one the same way if present).
    const bundleUpdates = {};
    if (p.bundleFullSetPriceUSD != null) {
      const bEff = Number(p.bundleFullSetPriceUSD);
      bundleUpdates.bundleFullSetPriceUSD = round2(bEff * MULTIPLIER);
    }
    if (p.bundleTopPriceUSD != null) {
      const bEff = Number(p.bundleTopPriceUSD);
      bundleUpdates.bundleTopPriceUSD = round2(bEff * MULTIPLIER);
    }
    if (p.bundleBottomPriceUSD != null) {
      const bEff = Number(p.bundleBottomPriceUSD);
      bundleUpdates.bundleBottomPriceUSD = round2(bEff * MULTIPLIER);
    }

    await Product.updateOne(
      { _id: p._id },
      { $set: { priceUSD: newPrice, discountPriceUSD: newDiscount, ...bundleUpdates } }
    );

    console.log(`  ✓ ${p.name.padEnd(45)} $${effective} → $${newDiscount} (was $${newPrice})`);
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${skipped} already inflated (skipped).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("✗ Script failed:", err.message);
  process.exit(1);
});
