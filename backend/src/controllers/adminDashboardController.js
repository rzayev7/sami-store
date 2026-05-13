const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

/** Realized revenue: paid money only; never cancelled/failed/refunded. */
const countsTowardRevenue = (order) => {
  const st = String(order.status || "").toLowerCase();
  if (st === "cancelled" || st === "failed") return false;
  const ps = String(order.paymentStatus || "").toLowerCase();
  if (ps === "refunded" || ps === "failed") return false;
  if (ps === "paid") return true;
  // Legacy rows where status moved forward but paymentStatus was not backfilled
  return ["paid", "shipped", "delivered"].includes(st);
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [orders, totalProducts] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).limit(200),
      Product.countDocuments(),
    ]);

    const totalRevenue = orders.reduce((sum, order) => {
      if (!countsTowardRevenue(order)) return sum;
      return sum + Number(order.totalPriceUSD || 0);
    }, 0);
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
      if (countsTowardRevenue(order)) {
        row.revenue += Number(order.totalPriceUSD || 0);
        row.orders += 1;
      }
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
    const [registeredCustomers, orders] = await Promise.all([
      Customer.find({}, "name email createdAt").sort({ createdAt: -1 }).lean(),
      Order.find({}, "customerInfo totalPriceUSD createdAt status paymentStatus").lean(),
    ]);

    // Build order stats keyed by email
    const orderStats = new Map();
    orders.forEach((order) => {
      const email = String(order.customerInfo?.email || "").toLowerCase();
      if (!email) return;
      const stat = orderStats.get(email) || { orderCount: 0, totalSpentUSD: 0, country: order.customerInfo?.country || "-" };
      stat.orderCount += 1;
      if (countsTowardRevenue(order)) {
        stat.totalSpentUSD += Number(order.totalPriceUSD || 0);
      }
      orderStats.set(email, stat);
    });

    // Merge registered accounts with order stats
    const customerMap = new Map();

    registeredCustomers.forEach((c) => {
      const email = String(c.email || "").toLowerCase();
      const stat = orderStats.get(email) || { orderCount: 0, totalSpentUSD: 0, country: "-" };
      customerMap.set(email, {
        name: c.name || "-",
        email,
        country: stat.country,
        orderCount: stat.orderCount,
        totalSpentUSD: stat.totalSpentUSD,
        registeredAt: c.createdAt,
        registered: true,
      });
    });

    // Also include guest customers (ordered but never registered)
    orderStats.forEach((stat, email) => {
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          name: "-",
          email,
          country: stat.country,
          orderCount: stat.orderCount,
          totalSpentUSD: stat.totalSpentUSD,
          registeredAt: null,
          registered: false,
        });
      }
    });

    const result = Array.from(customerMap.values()).sort((a, b) => {
      if (a.registeredAt && b.registeredAt) return new Date(b.registeredAt) - new Date(a.registeredAt);
      if (a.registeredAt) return -1;
      if (b.registeredAt) return 1;
      return b.orderCount - a.orderCount;
    });

    res.status(200).json(result);
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
      if (countsTowardRevenue(order)) {
        revenueByDay[key] = (revenueByDay[key] || 0) + Number(order.totalPriceUSD || 0);
        ordersByDay[key] = (ordersByDay[key] || 0) + 1;
      }
    });

    const soldByProductId = {};
    orders.forEach((order) => {
      if (!countsTowardRevenue(order)) return;
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
