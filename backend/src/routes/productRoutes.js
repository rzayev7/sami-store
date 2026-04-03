const express = require("express");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  incrementProductStock,
} = require("../controllers/productController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", protectAdmin, createProduct);
router.put("/:id", protectAdmin, updateProduct);
router.patch("/:id/stock/increment", protectAdmin, incrementProductStock);
router.delete("/:id", protectAdmin, deleteProduct);

module.exports = router;
