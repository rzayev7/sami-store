/**
 * Run once to seed the Category collection with the default clothing categories.
 * Usage: node backend/scripts/seedCategories.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Category = require("../src/models/Category");

const CATEGORIES = [
  { name: "Sets", slug: "sets" },
  { name: "Dresses", slug: "dresses" },
  { name: "Shirts & Blouses", slug: "shirts-blouses" },
  { name: "Pants & Skirts", slug: "pants-skirts" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  for (const cat of CATEGORIES) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (existing) {
      console.log(`  [skip] "${cat.name}" already exists`);
    } else {
      await Category.create(cat);
      console.log(`  [added] "${cat.name}"`);
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
