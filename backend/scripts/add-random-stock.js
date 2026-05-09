const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("../src/models/Product");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({}, "_id name stock");
  console.log("Found", products.length, "products");

  for (const p of products) {
    const add = Math.floor(Math.random() * 3) + 1;
    await Product.updateOne({ _id: p._id }, { $inc: { stock: add } });
    console.log(`${p.name} | was: ${p.stock} -> +${add} = ${(p.stock || 0) + add}`);
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
