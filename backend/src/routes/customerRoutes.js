const express = require("express");
const {
  signup,
  login,
  getMe,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  toggleWishlistItem,
  getMyOrders,
} = require("../controllers/customerController");
const { protectCustomer } = require("../middleware/customerAuthMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get("/me", protectCustomer, getMe);
router.put("/me", protectCustomer, updateProfile);

router.get("/addresses", protectCustomer, getAddresses);
router.post("/addresses", protectCustomer, addAddress);
router.put("/addresses/:addressId", protectCustomer, updateAddress);
router.delete("/addresses/:addressId", protectCustomer, deleteAddress);

router.get("/wishlist", protectCustomer, getWishlist);
router.post("/wishlist", protectCustomer, toggleWishlistItem);

router.get("/orders", protectCustomer, getMyOrders);

module.exports = router;
