"use client";

import { useState } from "react";
import api from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

export default function TrackOrderPage() {
  const { t } = useLanguage();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const statusLabel = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "pending") return t("tracking.received");
    if (value === "paid") return t("tracking.paid");
    if (value === "shipped") return t("tracking.shipped");
    if (value === "delivered") return t("tracking.delivered");
    if (value === "cancelled") return t("tracking.cancelled");
    return t("tracking.inProgress");
  };

  const statusHelper = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "pending") return t("tracking.receivedDesc");
    if (value === "paid") return t("tracking.paidDesc");
    if (value === "shipped") return t("tracking.shippedDesc");
    if (value === "delivered") return t("tracking.deliveredDesc");
    if (value === "cancelled") return t("tracking.cancelledDesc");
    return t("tracking.inProgressDesc");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setOrder(null);
    setErrorMessage("");

    const trimmedOrderId = orderId.trim();
    if (!trimmedOrderId) {
      setErrorMessage(t("tracking.enterOrderId"));
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await api.get(`/api/orders/${trimmedOrderId}`);
      setOrder(data);
    } catch {
      setErrorMessage(t("tracking.notFound"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-6">
      <div className="sami-section mx-auto w-full max-w-2xl p-6 sm:p-8">
        <h1 className="sami-title">{t("tracking.title")}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          {t("tracking.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="orderId"
              className="mb-1 block text-xs uppercase tracking-[0.14em] text-black/70"
            >
              {t("tracking.orderIdLabel")}
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
            {isLoading ? t("tracking.checking") : t("tracking.trackOrder")}
          </button>
        </form>

        {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}

        {order && (
          <div className="mt-6 space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)] p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {t("tracking.order")}{" "}
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
                <span className="font-medium">{t("tracking.trackingNumber")}</span>{" "}
                {order.trackingNumber || t("tracking.notAssigned")}
              </p>
              <p>
                <span className="font-medium">{t("tracking.customerCountry")}</span>{" "}
                {order.customerInfo?.country || "-"}
              </p>
              <p>
                <span className="font-medium">{t("tracking.orderDate")}</span>{" "}
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
