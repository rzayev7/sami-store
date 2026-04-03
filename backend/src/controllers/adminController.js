const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    const isMatch = admin ? await admin.matchPassword(password) : false;

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Set a secure, HttpOnly cookie for admin authentication so that
    // server-side middleware (Next.js / API) can reliably guard /admin routes.
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Preserve existing response shape for any clients that still read the
    // token from JSON.
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};

module.exports = { loginAdmin };
