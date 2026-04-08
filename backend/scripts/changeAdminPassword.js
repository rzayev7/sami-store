const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Admin = require("../src/models/Admin");

dotenv.config();

const EMAIL = process.argv[2];
const NEW_PASSWORD = process.argv[3];

if (!EMAIL || !NEW_PASSWORD || NEW_PASSWORD.length < 8) {
  console.error("Usage: node scripts/changeAdminPassword.js <email> <new-password>");
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const admin = await Admin.findOne({ email: EMAIL });
    if (!admin) {
      console.error("No admin account found in the database.");
      process.exit(1);
    }

    admin.password = NEW_PASSWORD;
    await admin.save();

    console.log(`Password updated for ${admin.email}`);
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
})();
