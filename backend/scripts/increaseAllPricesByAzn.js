/**
 * Adds a fixed amount (default 17 AZN) to all product price fields.
 * Updates: priceUSD, discountPriceUSD (if set), bundleFullSetPriceUSD,
 * bundleTopPriceUSD, bundleBottomPriceUSD (if set).
 *
 * Usage (from repo root or backend folder — paths below assume cwd is backend):
 *   node scripts/increaseAllPricesByAzn.js
 *   node scripts/increaseAllPricesByAzn.js --dry-run
 *   node scripts/increaseAllPricesByAzn.js --amount=25
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Product = require("../src/models/Product");

const DEFAULT_DELTA = 17;

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  let amount = DEFAULT_DELTA;
  const amountArg = process.argv.find((a) => a.startsWith("--amount="));
  if (amountArg) {
    const n = Number(amountArg.split("=")[1]);
    if (!Number.isFinite(n)) {
      console.error("Invalid --amount= value");
      process.exit(1);
    }
    amount = n;
  }
  return { dryRun, amount };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function bumpPrice(value, delta) {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return round2(num + delta);
}

async function run() {
  const { dryRun, amount } = parseArgs();

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
  console.log(`Delta: +${amount} (same unit as stored prices, AZN in your admin)`);
  if (dryRun) console.log("DRY RUN — no writes\n");

  const products = await Product.find({}).lean();
  let updated = 0;

  for (const doc of products) {
    const next = {
      priceUSD: bumpPrice(doc.priceUSD, amount),
      discountPriceUSD:
        doc.discountPriceUSD != null && Number(doc.discountPriceUSD) > 0
          ? bumpPrice(doc.discountPriceUSD, amount)
          : doc.discountPriceUSD,
      bundleFullSetPriceUSD:
        doc.bundleFullSetPriceUSD != null && Number(doc.bundleFullSetPriceUSD) > 0
          ? bumpPrice(doc.bundleFullSetPriceUSD, amount)
          : doc.bundleFullSetPriceUSD,
      bundleTopPriceUSD:
        doc.bundleTopPriceUSD != null && Number(doc.bundleTopPriceUSD) > 0
          ? bumpPrice(doc.bundleTopPriceUSD, amount)
          : doc.bundleTopPriceUSD,
      bundleBottomPriceUSD:
        doc.bundleBottomPriceUSD != null && Number(doc.bundleBottomPriceUSD) > 0
          ? bumpPrice(doc.bundleBottomPriceUSD, amount)
          : doc.bundleBottomPriceUSD,
    };

    const changed =
      next.priceUSD !== doc.priceUSD ||
      next.discountPriceUSD !== doc.discountPriceUSD ||
      next.bundleFullSetPriceUSD !== doc.bundleFullSetPriceUSD ||
      next.bundleTopPriceUSD !== doc.bundleTopPriceUSD ||
      next.bundleBottomPriceUSD !== doc.bundleBottomPriceUSD;

    if (!changed) continue;

    if (!dryRun) {
      await Product.updateOne({ _id: doc._id }, { $set: next });
    }
    updated += 1;
    console.log(
      `${doc.code || doc._id} | ${doc.name} | ${doc.priceUSD} → ${next.priceUSD}` +
        (doc.discountPriceUSD ? ` (sale ${doc.discountPriceUSD} → ${next.discountPriceUSD})` : ""),
    );
  }

  console.log(`\nProducts scanned: ${products.length}`);
  console.log(dryRun ? `Would update: ${updated}` : `Updated: ${updated}`);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
