const dotenv = require("dotenv");
const connectDB = require("./db");
const Admin = require("../models/Admin");

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({ email: "admin@sami.com" });
    if (existingAdmin) {
      console.log("Admin already exists: admin@sami.com");
      process.exit(0);
    }

    const admin = new Admin({
      email: "admin@sami.com",
      password: "admin123",
    });

    await admin.save();
    console.log("Admin created successfully: admin@sami.com");
    process.exit(0);
  } catch (error) {
    console.error(`Failed to create admin: ${error.message}`);
    process.exit(1);
  }
};

createAdmin();
