/**
 * Sets category="Sets" for ALL products.
 *
 * Usage:
 *   node backend/scripts/setAllProductCategoriesToSets.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Product = require("../src/models/Product");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const before = await Product.countDocuments();
  const result = await Product.updateMany({}, { $set: { category: "Sets" } });

  console.log("Products:", before);
  console.log("Matched:", result.matchedCount ?? result.n ?? "unknown");
  console.log("Modified:", result.modifiedCount ?? result.nModified ?? "unknown");

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
