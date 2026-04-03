// backend/src/scripts/createAdmin.js
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../backend/.env") });

const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "admin@samistore.com";
    const password = "admin123"; // ПАРОЛЬ В ЧИСТОМ ВИДЕ

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("⚠️ Admin already exists with this email:", email);
      process.exit(0);
    }

    const admin = await Admin.create({
      email,
      password, // <-- БЕЗ bcrypt здесь
    });

    console.log("✅ Admin created:");
    console.log({ id: admin._id.toString(), email: admin.email });
    console.log("Use this password to log in:", password);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
}

run();