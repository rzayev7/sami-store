const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    // Also accept token from query string for browser-navigable endpoints (e.g. CSV export).
    const queryToken = typeof req.query?.token === "string" ? req.query.token : "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : queryToken;

    if (!token) {
      return res.status(401).json({ message: "Admin token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("_id email");

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin token" });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = { protectAdmin };
