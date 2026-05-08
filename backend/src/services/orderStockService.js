const Product = require("../models/Product");

const deductStockForPaidOrder = async (order) => {
  if (!order || order.paymentStatus !== "paid" || order.stockDeductedAt) {
    return false;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  if (items.length === 0) {
    order.stockDeductedAt = new Date();
    return true;
  }

  const rollbacks = [];
  for (const item of items) {
    const productId = String(item?.productId || "");
    const quantity = Math.max(1, Math.trunc(Number(item?.quantity || 1)));

    const result = await Product.updateOne(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
    );

    if (result.matchedCount === 0) {
      for (const rb of rollbacks) {
        await Product.updateOne({ _id: rb.productId }, { $inc: { stock: rb.quantity } });
      }
      throw new Error(`"${item?.name || "Item"}" is out of stock or insufficient quantity available`);
    }

    rollbacks.push({ productId, quantity });
  }

  order.stockDeductedAt = new Date();
  order.timeline = order.timeline || [];
  order.timeline.push({
    event: "stock_deducted",
    timestamp: new Date(),
    note: "Inventory decremented after payment confirmation",
  });
  return true;
};

module.exports = {
  deductStockForPaidOrder,
};
