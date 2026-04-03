"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import StatusBadge from "../../../components/admin/StatusBadge";
import { t } from "../../../lib/admin-i18n";
import { formatSizeLabel } from "../../../lib/sizeDisplay";

const quickStatusActions = ["paid", "shipped", "delivered", "cancelled"];

const statusLabels = {
  paid: t.markAsPaid,
  shipped: t.markAsShipped,
  delivered: t.markAsDelivered,
  cancelled: t.markAsCancelled,
};

function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-110"
        >
          ✕
        </button>
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  if (!value || value === "-") return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 font-medium text-black/60">{label}:</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [search, setSearch] = useState("");
  const [lightboxImg, setLightboxImg] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [trackingSaving, setTrackingSaving] = useState("");
  const [trackingSaved, setTrackingSaved] = useState("");

  const closeLightbox = useCallback(() => setLightboxImg(null), []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const { data } = await api.get("/api/orders", {
          headers: getAdminAuthHeaders(),
        });
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setErrorMessage(t.failedLoadOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, nextStatus, nextPaymentStatus) => {
    try {
      setUpdatingId(orderId);
      await api.put(
        `/api/orders/${orderId}`,
        {
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(nextPaymentStatus ? { paymentStatus: nextPaymentStatus } : {}),
        },
        { headers: getAdminAuthHeaders() }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                ...(nextStatus ? { status: nextStatus } : {}),
                ...(nextPaymentStatus ? { paymentStatus: nextPaymentStatus } : {}),
              }
            : order
        )
      );
    } catch {
      setErrorMessage(t.failedUpdateOrder);
    } finally {
      setUpdatingId("");
    }
  };

  const saveTrackingNumber = async (orderId) => {
    const value = (trackingInputs[orderId] ?? "").trim();
    if (!value) return;
    try {
      setTrackingSaving(orderId);
      await api.put(
        `/api/orders/${orderId}`,
        { trackingNumber: value },
        { headers: getAdminAuthHeaders() }
      );
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, trackingNumber: value } : o))
      );
      setTrackingSaved(orderId);
      setTimeout(() => setTrackingSaved((prev) => (prev === orderId ? "" : prev)), 2000);
    } catch {
      setErrorMessage(t.failedUpdateOrder);
    } finally {
      setTrackingSaving("");
    }
  };

  const buildFullAddress = (ci) => {
    if (!ci) return "-";
    const parts = [
      ci.address,
      ci.city,
      ci.state,
      ci.postalCode,
      ci.country,
    ].filter(Boolean);
    return parts.join(", ") || "-";
  };

  const filteredOrders = orders.filter((order) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(order._id || "").toLowerCase().includes(q) ||
      String(order.customerInfo?.name || "").toLowerCase().includes(q) ||
      String(order.customerInfo?.email || "").toLowerCase().includes(q) ||
      String(order.customerInfo?.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <section className="space-y-5">
      {lightboxImg && (
        <ImageLightbox src={lightboxImg.src} alt={lightboxImg.alt} onClose={closeLightbox} />
      )}

      <div className="w-full">
        <h1 className="sami-title">{t.orders}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t.trackOrders}</p>
        <div className="mt-4">
          <input
            type="search"
            placeholder={t.searchOrders}
            className="sami-input max-w-md"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {/* Orders Table */}
        <div className="sami-section mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-[var(--color-sand)] text-black">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.orderId}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.customer}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.country}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.totalPrice}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.status}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.trackingNumber}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.created}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.action}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-black/70">
                    {t.loadingOrders}
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-red-600">
                    {errorMessage}
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-black/70">
                    {t.noOrdersFound}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <Fragment key={order._id}>
                    <tr
                      className={`border-t border-[var(--color-line)] transition-colors ${
                        expandedOrderId === order._id ? "bg-[var(--color-sand)]/40" : "hover:bg-black/[0.015]"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-black/70">
                        #{String(order._id || "-").slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{order.customerInfo?.name || "-"}</p>
                          <p className="text-xs text-black/50">{order.customerInfo?.email || ""}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{order.customerInfo?.country || "-"}</td>
                      <td className="px-4 py-3 font-medium">
                        ₼{Number(order.totalPriceUSD || order.totalPrice || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={order.status || "pending"} />
                        {order.paymentStatus && order.paymentStatus !== "pending" && order.paymentStatus !== order.status && (
                          <span className="mt-0.5 block text-[10px] text-black/35">
                            {t.payment}: {order.paymentStatus === "paid" ? t.statusPaid : order.paymentStatus === "failed" ? t.statusFailed : order.paymentStatus === "refunded" ? t.statusRefunded : order.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.trackingNumber ? (
                          <span className="font-mono text-xs text-black/60">
                            {order.trackingNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-black/25">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-black/70">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("ru-RU", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId((prev) => (prev === order._id ? "" : order._id))
                          }
                          className="sami-btn-light px-3 py-1"
                        >
                          {expandedOrderId === order._id ? t.hideDetails : t.viewDetails}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Panel */}
                    {expandedOrderId === order._id && (
                      <tr>
                        <td colSpan={8} className="border-t border-[var(--color-line)] bg-white p-0">
                          <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.5fr_1fr]">
                            {/* Left: Customer & Shipping */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-black/50">
                                  {t.customerInfo}
                                </h4>
                                <div className="space-y-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/30 p-3">
                                  <InfoRow label={t.customer} value={order.customerInfo?.name || order.user?.name} />
                                  <InfoRow label={t.email} value={order.customerInfo?.email || order.user?.email} />
                                  <InfoRow label={t.phone} value={order.customerInfo?.phone} />
                                  {order.customerInfo?.taxNumber && (
                                    <InfoRow label={t.taxNumber} value={order.customerInfo.taxNumber} mono />
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-black/50">
                                  {t.shippingAddress}
                                </h4>
                                <div className="space-y-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/30 p-3">
                                  <InfoRow label={t.address} value={order.customerInfo?.address} />
                                  <InfoRow
                                    label={t.city || "Город"}
                                    value={order.customerInfo?.city}
                                  />
                                  <InfoRow
                                    label="Регион"
                                    value={order.customerInfo?.state}
                                  />
                                  <InfoRow label={t.postalCode} value={order.customerInfo?.postalCode} />
                                  <InfoRow label={t.country} value={order.customerInfo?.country} />
                                  <div className="mt-2 border-t border-dashed border-[var(--color-line)] pt-2">
                                    <p className="text-xs font-medium text-black/40">Полный адрес:</p>
                                    <p className="mt-0.5 text-sm">{buildFullAddress(order.customerInfo)}</p>
                                  </div>
                                </div>
                              </div>

                              {order.orderNotes && String(order.orderNotes).trim() && (
                                <div>
                                  <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-black/50">
                                    {t.orderNotes}
                                  </h4>
                                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/30 p-3">
                                    <p className="whitespace-pre-wrap text-sm text-black/85">{order.orderNotes}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Center: Ordered Products */}
                            <div>
                              <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-black/50">
                                {t.orderedProducts}
                              </h4>
                              <div className="space-y-2">
                                {(Array.isArray(order.items) ? order.items : []).map((item, idx) => (
                                  <div
                                    key={`${item.productId || "item"}-${idx}`}
                                    className="flex gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/20 p-3"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLightboxImg({
                                          src: item.image || "https://placehold.co/400x600?text=Sami",
                                          alt: item.name || "Product",
                                        })
                                      }
                                      className="group relative h-20 w-16 shrink-0 overflow-hidden rounded border border-[var(--color-line)] bg-white transition-shadow hover:shadow-md"
                                      title={t.enlargeImage}
                                    >
                                      <img
                                        src={item.image || "https://placehold.co/120x160?text=Sami"}
                                        alt={item.name || "Product"}
                                        className="h-full w-full object-cover"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                                        <svg
                                          className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium leading-tight">{item.name || "-"}</p>
                                      {item.code && (
                                        <p className="mt-0.5 font-mono text-[11px] text-black/40">
                                          {t.code}: {item.code}
                                        </p>
                                      )}
                                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-black/60">
                                        {item.size && <span>{t.size}: {formatSizeLabel(item.size)}</span>}
                                        {item.color && <span>{t.color}: {item.color}</span>}
                                        <span>{t.qty}: {Number(item.quantity || 0)}</span>
                                      </div>
                                      <p className="mt-1 text-sm font-semibold">
                                        ₼{Number(item.priceUSD || 0).toFixed(2)}
                                        {Number(item.quantity || 0) > 1 && (
                                          <span className="ml-1 font-normal text-black/40">
                                            × {item.quantity} = ₼{(Number(item.priceUSD || 0) * Number(item.quantity || 0)).toFixed(2)}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Right: Summary + Actions */}
                            <div className="space-y-4">
                              <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-black/50">
                                  {t.orderSummary}
                                </h4>
                                <div className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/30 p-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-black/60">{t.subtotal}</span>
                                    <span>
                                      ₼
                                      {Number(
                                        (Array.isArray(order.items) ? order.items : []).reduce(
                                          (sum, item) =>
                                            sum + Number(item.priceUSD || 0) * Number(item.quantity || 0),
                                          0
                                        )
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-black/60">{t.shipping}</span>
                                    <span>₼{Number(order.shippingCost || 0).toFixed(2)}</span>
                                  </div>
                                  {order.couponCode && (
                                    <div className="flex justify-between text-green-600">
                                      <span>Купон: {order.couponCode}</span>
                                      <span>Применён</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-[var(--color-line)] pt-2 font-semibold">
                                    <span>{t.total}</span>
                                    <span>₼{Number(order.totalPriceUSD || order.totalPrice || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-black/50">
                                  {t.orderActions}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {quickStatusActions.map((status) => {
                                    const isActive =
                                      order.status === status ||
                                      (status === "paid" && order.paymentStatus === "paid");
                                    return (
                                      <button
                                        key={status}
                                        type="button"
                                        disabled={updatingId === order._id || isActive}
                                        onClick={() => {
                                          if (
                                            status === "shipped" &&
                                            !(
                                              (trackingInputs[order._id] || "").trim() ||
                                              order.trackingNumber
                                            )
                                          ) {
                                            setErrorMessage(
                                              t.trackingRequiredBeforeShipped ||
                                                "Add tracking number before marking as shipped.",
                                            );
                                            return;
                                          }

                                          updateOrderStatus(
                                            order._id,
                                            status,
                                            status === "paid" ? "paid" : undefined,
                                          );
                                        }}
                                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                          isActive
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : "border-[var(--color-line)] bg-white text-black hover:bg-[var(--color-sand)]"
                                        }`}
                                      >
                                        {isActive ? "✓ " : ""}
                                        {statusLabels[status]}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Tracking Number */}
                              <div>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-black/50">
                                  {t.trackingNumber}
                                </h4>
                                <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/30 p-3">
                                  {order.trackingNumber ? (
                                    <div className="flex items-center gap-2">
                                      <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      <span className="font-mono text-sm font-semibold tracking-wider">
                                        {order.trackingNumber}
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-black/40">{t.noTrackingYet}</p>
                                  )}
                                  <div className="mt-2 flex gap-2">
                                    <input
                                      type="text"
                                      value={trackingInputs[order._id] ?? order.trackingNumber ?? ""}
                                      onChange={(e) =>
                                        setTrackingInputs((prev) => ({
                                          ...prev,
                                          [order._id]: e.target.value,
                                        }))
                                      }
                                      placeholder={t.trackingPlaceholder}
                                      className="sami-input flex-1 font-mono text-sm"
                                    />
                                    <button
                                      type="button"
                                      disabled={
                                        trackingSaving === order._id ||
                                        !(trackingInputs[order._id] ?? "").trim() ||
                                        (trackingInputs[order._id] ?? "").trim() === (order.trackingNumber || "")
                                      }
                                      onClick={() => saveTrackingNumber(order._id)}
                                      className="sami-btn-dark shrink-0 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {trackingSaving === order._id
                                        ? t.savingTracking
                                        : trackingSaved === order._id
                                          ? t.trackingSaved
                                          : t.saveTracking}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
