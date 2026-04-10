/**
 * Shorten selected long product codes to compact codes.
 *
 * Usage:
 *   node backend/scripts/shortenProductCodes.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const crypto = require("crypto");
const mongoose = require("mongoose");
const Product = require("../src/models/Product");

const TARGET_CODES = [
  "PRD-20260401-JLF0",
  "PRD-20260401-0S87",
  "PRD-20260401-2F72",
  "PRD-20260401-H603",
  "PRD-20260405-CUNW",
  "PRD-20260405-W4T3",
  "PRD-20260405-O81E",
  "PRD-20260406-BFUT",
  "PRD-20260406-IPOU",
  "PRD-20260406-KXWY",
  "PRD-20260406-8TUU",
  "PRD-20260406-GWIN",
  "PRD-20260406-IH1I",
  "PRD-20260409-33H9",
  "PRD-20260409-JAGH",
  "PRD-20260409-QG3N",
  "PRD-20260409-HKEV",
  "PRD-20260409-K2QL",
  "PRD-20260409-DDYE",
  "PRD-20260409-RC3I",
  "PRD-20260409-MT05",
  "PRD-20260409-GAXA",
  "PRD-20260409-W6U7",
  "PRD-20260409-6CY7",
];

const createCandidate = () => `P${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

async function generateUniqueCode(reservedSet) {
  for (let i = 0; i < 20; i += 1) {
    const candidate = createCandidate();
    if (reservedSet.has(candidate)) continue;
    const exists = await Product.exists({ code: candidate });
    if (!exists) {
      reservedSet.add(candidate);
      return candidate;
    }
  }
  throw new Error("Failed to generate a unique short code");
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const products = await Product.find({ code: { $in: TARGET_CODES } }, { _id: 1, code: 1, name: 1 }).lean();
  const foundSet = new Set(products.map((p) => p.code));
  const missing = TARGET_CODES.filter((code) => !foundSet.has(code));

  if (missing.length) {
    console.log("Codes not found:");
    for (const code of missing) console.log(" -", code);
  }

  if (products.length === 0) {
    console.log("No matching products to update.");
    await mongoose.disconnect();
    return;
  }

  const reservedSet = new Set();
  const updates = [];

  for (const p of products) {
    const newCode = await generateUniqueCode(reservedSet);
    updates.push({ id: p._id, oldCode: p.code, newCode, name: p.name });
  }

  const ops = updates.map((u) => ({
    updateOne: {
      filter: { _id: u.id },
      update: { $set: { code: u.newCode } },
    },
  }));

  const result = await Product.bulkWrite(ops, { ordered: true });

  console.log("Updated:", result.modifiedCount ?? "unknown");
  console.log("New code map:");
  for (const u of updates) {
    console.log(` - ${u.oldCode} -> ${u.newCode} (${u.name})`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

