/**
 * Bulk rename products by exact name match.
 *
 * Usage:
 *   node backend/scripts/renameProducts.js
 *
 * Notes:
 * - Matches are exact (case-sensitive) on Product.name.
 * - If you want case-insensitive matching, ask and we can adjust safely.
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Product = require("../src/models/Product");

/** @type {{ oldName: string, newName: string }[]} */
const RENAMES = [
  { oldName: "Linen Set with Crochet Cardigan", newName: "Crochet Linen Set" },
  { oldName: "Elegant Linen set with Long Shirt", newName: "Long Shirt Linen Set" },
  { oldName: "Linen Vest & Wide-Leg Pants Two-Piece Set", newName: "Linen Vest Set" },
  { oldName: "Linen Sleeveless Maxi Dress with Ruched Waist Detail", newName: "Ruched Linen Maxi Dress" },
  { oldName: "Black Linen Strappy Maxi Dress with Contrast Trim", newName: "Black Linen Maxi Dress" },
  { oldName: "Chocolate Linen Maxi Dress with Lace Tiered Hem", newName: "Chocolate Linen Dress" },
  { oldName: "Breezy Oversized Blouse & Floral Maxi Skirt Two-Piece Set", newName: "Floral Skirt Set" },
  { oldName: "Three-Piece Linen Set: Long Cardigan, Top, and Wide-Leg Trousers", newName: "3-Piece Cardigan Linen Set" },
  { oldName: "Denim Blue Linen Set: Asymmetrical Tunic & Graphic Print Wide-Leg Pants", newName: "Denim Blue Linen Set" },
  { oldName: "Three-Piece Linen & Sequin Set: Maxi Shirt-Cardigan, Shimmering Top, and Wide-Leg Trousers", newName: "3-Piece Sequin Linen Set" },
  { oldName: "Earth-Tone Linen Set: Asymmetrical Tunic & Graphic Floral Wide-Leg Pants", newName: "Earth-Tone Linen Set" },
  { oldName: "Sage Green Linen Set: Batwing Tunic & Wide-Leg Pants with Floral Appliqué", newName: "Sage Linen Set" }
];

function normalizeName(s) {
  return String(s ?? "").trim();
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  const renames = RENAMES.map((r) => ({
    oldName: normalizeName(r.oldName),
    newName: normalizeName(r.newName),
  })).filter((r) => r.oldName && r.newName && r.oldName !== r.newName);

  if (renames.length === 0) {
    console.log("No renames provided. Edit RENAMES in this file and re-run.");
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const ops = renames.map(({ oldName, newName }) => ({
    updateMany: {
      filter: { name: oldName },
      update: { $set: { name: newName } },
    },
  }));

  // Pre-flight: which old names exist?
  const oldNames = renames.map((r) => r.oldName);
  const existing = await Product.find({ name: { $in: oldNames } }, { name: 1 }).lean();
  const existingSet = new Set(existing.map((p) => p.name));

  const missing = oldNames.filter((n) => !existingSet.has(n));
  if (missing.length) {
    console.log("Not found (no product with exact name):");
    for (const n of missing) console.log(" -", n);
  }

  const result = await Product.bulkWrite(ops, { ordered: false });

  console.log("Matched:", result.matchedCount ?? "unknown");
  console.log("Modified:", result.modifiedCount ?? "unknown");

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

