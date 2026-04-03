"use client";

import { useState } from "react";
import api from "../../lib/api";

const statusLabel = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "pending") return "Order received";
  if (value === "paid") return "Payment confirmed";
  if (value === "shipped") return "Shipped";
  if (value === "delivered") return "Delivered";
  if (value === "cancelled") return "Cancelled";
  return "In progress";
};

const statusHelper = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "pending") {
    return "We have received your order and are preparing it.";
  }
  if (value === "paid") {
    return "Your payment is confirmed. Your order will be shipped soon.";
  }
  if (value === "shipped") {
    return "Your order has left our warehouse and is on its way.";
  }
  if (value === "delivered") {
    return "Your order has been delivered.";
  }
  if (value === "cancelled") {
    return "This order has been cancelled.";
  }
  return "Your order is being processed.";
};

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setOrder(null);
    setErrorMessage("");

    const trimmedOrderId = orderId.trim();
    if (!trimmedOrderId) {
      setErrorMessage("Please enter Order ID");
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await api.get(`/api/orders/${trimmedOrderId}`);
      setOrder(data);
    } catch {
      setErrorMessage("Order not found");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-6">
      <div className="sami-section mx-auto w-full max-w-2xl p-6 sm:p-8">
        <h1 className="sami-title">Track Order</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Enter your Order ID to view current delivery information.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="orderId"
              className="mb-1 block text-xs uppercase tracking-[0.14em] text-black/70"
            >
              Order ID
            </label>
            <input
              id="orderId"
              type="text"
              required
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              className="sami-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="sami-btn-dark w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isLoading ? "Checking..." : "Track Order"}
          </button>
        </form>

        {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

        {order && (
          <div className="mt-6 space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)] p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                Order{" "}
                <span className="font-mono text-xs text-black/70">
                  #{String(order._id || "").slice(-8).toUpperCase()}
                </span>
              </p>
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-black/70">
                {statusLabel(order.status)}
              </span>
            </div>

            <p className="text-xs text-[var(--color-muted)]">
              {statusHelper(order.status)}
            </p>

            <div className="mt-2 space-y-1">
              <p>
                <span className="font-medium">Tracking number:</span>{" "}
                {order.trackingNumber || "Not assigned yet"}
              </p>
              <p>
                <span className="font-medium">Customer country:</span>{" "}
                {order.customerInfo?.country || "-"}
              </p>
              <p>
                <span className="font-medium">Order date:</span>{" "}
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
