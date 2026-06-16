const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

function isProductsPublicEnabled() {
  return String(process.env.PRODUCTS_PUBLIC_ENABLED || "true").toLowerCase() !== "false";
}

async function hasValidAdminToken(req) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return false;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("_id");
    return Boolean(admin);
  } catch {
    return false;
  }
}

async function canAccessProductsPublicly(req) {
  if (isProductsPublicEnabled()) return true;
  return hasValidAdminToken(req);
}

module.exports = {
  isProductsPublicEnabled,
  canAccessProductsPublicly,
};
