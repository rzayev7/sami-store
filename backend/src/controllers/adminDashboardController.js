const Order = require("../models/Order");
const Product = require("../models/Product");

const getDashboardStats = async (req, res, next) => {
  try {
    const [orders, totalProducts] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(200),
      Product.countDocuments(),
    ]);

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalPriceUSD || 0),
      0
    );
    const totalOrders = orders.length;
    const customersSet = new Set(
      orders.map((order) => (order.customerInfo?.email || "").toLowerCase()).filter(Boolean)
    );
    const totalCustomers = customersSet.size;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    const dailyMap = new Map();
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { date: key, revenue: 0, orders: 0 });
    }

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      if (!dailyMap.has(key)) return;
      const row = dailyMap.get(key);
      row.revenue += Number(order.totalPriceUSD || 0);
      row.orders += 1;
    });

    const recentOrders = orders.slice(0, 8).map((order) => ({
      _id: order._id,
      customerName: order.customerInfo?.name || "-",
      email: order.customerInfo?.email || "-",
      totalPriceUSD: Number(order.totalPriceUSD || 0),
      status: order.status || "pending",
      createdAt: order.createdAt,
    }));

    res.status(200).json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      salesLast30Days: Array.from(dailyMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

const getCustomersSummary = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const customerMap = new Map();

    orders.forEach((order) => {
      const email = String(order.customerInfo?.email || "").toLowerCase();
      if (!email) return;

      const existing = customerMap.get(email) || {
        name: order.customerInfo?.name || "-",
        email,
        country: order.customerInfo?.country || "-",
        orderCount: 0,
        totalSpentUSD: 0,
      };

      existing.orderCount += 1;
      existing.totalSpentUSD += Number(order.totalPriceUSD || 0);
      customerMap.set(email, existing);
    });

    res.status(200).json(Array.from(customerMap.values()));
  } catch (error) {
    next(error);
  }
};

const getSalesAnalytics = async (req, res, next) => {
  try {
    const [orders, products] = await Promise.all([Order.find(), Product.find()]);

    const revenueByDay = {};
    const ordersByDay = {};

    orders.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      revenueByDay[key] = (revenueByDay[key] || 0) + Number(order.totalPriceUSD || 0);
      ordersByDay[key] = (ordersByDay[key] || 0) + 1;
    });

    const soldByProductId = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = String(item.productId || item.name || "");
        soldByProductId[key] = (soldByProductId[key] || 0) + Number(item.quantity || 0);
      });
    });

    const bestSellingProducts = products
      .map((product) => ({
        productId: String(product._id),
        name: product.name,
        soldUnits: soldByProductId[String(product._id)] || 0,
      }))
      .sort((a, b) => b.soldUnits - a.soldUnits)
      .slice(0, 10);

    res.status(200).json({
      revenueByDay,
      ordersByDay,
      bestSellingProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getCustomersSummary,
  getSalesAnalytics,
};
