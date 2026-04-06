const Product = require("../models/Product");

/** Cent rounding only — no FX; matches admin-entered values. */
const roundPriceCents = (value) => {
  const x = Number(value);
  if (!Number.isFinite(x)) return x;
  return Math.round(x * 100) / 100;
};

const MONEY_FIELDS = [
  "priceUSD",
  "discountPriceUSD",
  "bundleFullSetPriceUSD",
  "bundleTopPriceUSD",
  "bundleBottomPriceUSD",
];

function normalizeMoneyFields(payload) {
  if (!payload || typeof payload !== "object") return;
  for (const key of MONEY_FIELDS) {
    if (key === "discountPriceUSD") {
      if (payload[key] === "" || payload[key] === undefined) {
        payload[key] = null;
        continue;
      }
      if (payload[key] === null) continue;
    }
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") continue;
    const r = roundPriceCents(payload[key]);
    if (Number.isFinite(r)) payload[key] = r;
  }
}

const toNonNegativeInt = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback;
};

const generateProductCode = () => {
  // Simple human-readable code, e.g. "PRD-20260316-AB12"
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRD-${y}${m}${d}-${rand}`;
};

const getProducts = async (req, res, next) => {
  try {
    const hasPage = req.query?.page != null && req.query?.page !== "";
    if (!hasPage) {
      const products = await Product.find();
      return res.status(200).json(products);
    }

    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query?.limit, 10) || 50));
    const search = String(req.query?.search || "").trim();

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (page - 1) * limit;

    const products = await Product.find(filter).skip(skip).limit(limit);

    res.status(200).json({
      products,
      page,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (!payload.name) {
      return res.status(400).json({ message: "Product name is required" });
    }

    // If no code was provided, generate one automatically.
    if (!payload.code || String(payload.code).trim() === "") {
      payload.code = generateProductCode();
    }

    // Try to find an existing product by name (and optional category if provided).
    const existingFilter = { name: payload.name };
    if (payload.category) {
      existingFilter.category = payload.category;
    }

    const existingProduct = await Product.findOne(existingFilter);

    if (existingProduct) {
      // When an existing product is found, also return its code and price.
      return res.status(200).json({
        exists: true,
        product: {
          _id: existingProduct._id,
          name: existingProduct.name,
          code: existingProduct.code,
          priceUSD: roundPriceCents(existingProduct.priceUSD),
          discountPriceUSD:
            existingProduct.discountPriceUSD != null
              ? roundPriceCents(existingProduct.discountPriceUSD)
              : null,
          category: existingProduct.category,
        },
      });
    }

    normalizeMoneyFields(payload);
    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.stock !== undefined) {
      payload.stock = toNonNegativeInt(payload.stock, 0);
    }
    normalizeMoneyFields(payload);

    let product = await Product.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    // Defensive: ensure stock is set exactly to requested value (admin edit).
    // Prevents subtle double-writes / concurrent increments from leaving stock off-by-one.
    if (
      product &&
      payload.stock !== undefined &&
      Number(product.stock) !== Number(payload.stock)
    ) {
      product = await Product.findByIdAndUpdate(
        req.params.id,
        { $set: { stock: payload.stock } },
        { new: true, runValidators: true }
      );
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const incrementProductStock = async (req, res, next) => {
  try {
    const delta = toNonNegativeInt(req.body?.delta, 0);
    if (delta <= 0) {
      return res.status(400).json({ message: "delta must be a positive integer" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: delta } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  incrementProductStock,
};
