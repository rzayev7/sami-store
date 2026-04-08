const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const Order = require("../models/Order");

const generateToken = (id) =>
  jwt.sign({ id, role: "customer" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists" });
    }

    const customer = await Customer.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    res.status(201).json({
      token: generateToken(customer._id),
      user: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase() });
    const isMatch = customer ? await customer.matchPassword(password) : false;

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json({
      token: generateToken(customer._id),
      user: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  const customer = req.customer;
  res.json({
    _id: customer._id,
    name: customer.name,
    email: customer.email,
    addresses: customer.addresses,
    wishlist: customer.wishlist,
    createdAt: customer.createdAt,
  });
};

const updateProfile = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    const { name, email, currentPassword, newPassword } = req.body;

    if (name) customer.name = name;

    if (email && email.toLowerCase() !== customer.email) {
      const existing = await Customer.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
      customer.email = email.toLowerCase();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password is required" });
      }
      const isMatch = await customer.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      customer.password = newPassword;
    }

    await customer.save();

    res.json({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
    });
  } catch (error) {
    next(error);
  }
};

const getAddresses = async (req, res) => {
  res.json(req.customer.addresses);
};

const addAddress = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    const { label, name, phone, country, address, city, state, postalCode, isDefault } = req.body;

    if (isDefault) {
      customer.addresses.forEach((a) => (a.isDefault = false));
    }

    customer.addresses.push({
      label, name, phone, country, address, city, state, postalCode,
      isDefault: customer.addresses.length === 0 || isDefault,
    });

    await customer.save();
    res.status(201).json(customer.addresses);
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    const addr = customer.addresses.id(req.params.addressId);

    if (!addr) {
      return res.status(404).json({ message: "Address not found" });
    }

    const fields = ["label", "name", "phone", "country", "address", "city", "state", "postalCode", "isDefault"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) addr[f] = req.body[f];
    });

    if (req.body.isDefault) {
      customer.addresses.forEach((a) => {
        if (!a._id.equals(addr._id)) a.isDefault = false;
      });
    }

    await customer.save();
    res.json(customer.addresses);
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    const addr = customer.addresses.id(req.params.addressId);

    if (!addr) {
      return res.status(404).json({ message: "Address not found" });
    }

    addr.deleteOne();
    await customer.save();
    res.json(customer.addresses);
  } catch (error) {
    next(error);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id).populate("wishlist");
    res.json(customer.wishlist);
  } catch (error) {
    next(error);
  }
};

const toggleWishlistItem = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.customer._id);
    const { productId } = req.body;
    const idx = customer.wishlist.findIndex((id) => id.toString() === productId);

    if (idx > -1) {
      customer.wishlist.splice(idx, 1);
    } else {
      customer.wishlist.push(productId);
    }

    await customer.save();
    const populated = await Customer.findById(customer._id).populate("wishlist");
    res.json(populated.wishlist);
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [
        { customerId: req.customer._id },
        { "customerInfo.email": req.customer.email },
      ],
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
