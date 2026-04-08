"use client";

import Link from "../../components/LocaleLink";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { getCustomerAuthHeaders } from "../../lib/customerAuth";
import { formatSizeLabel } from "../../lib/sizeDisplay";

function OrderSuccessInner() {
  const searchParams = useSearchParams();
  const { user: customerUser } = useAuth();
  const { t } = useLanguage();
  const orderIdFromQuery = searchParams.get("orderId") || "";
  const emailFromQuery = searchParams.get("email") || "";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderIdFromQuery);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderIdFromQuery) return;

    let cancelled = false;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const headers = customerUser ? getCustomerAuthHeaders() : {};
        const query = emailFromQuery
          ? `?email=${encodeURIComponent(emailFromQuery)}`
          : "";

        const { data } = await api.get(
          `/api/orders/${encodeURIComponent(orderIdFromQuery)}${query}`,
          { headers },
        );
        if (!cancelled) {
          setOrder(data);
        }
      } catch {
        if (!cancelled) {
          setError(t("orderSuccess.loadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [orderIdFromQuery]);

  const items = Array.isArray(order?.items) ? order.items : [];
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.priceUSD || 0) * Number(item.quantity || 0),
    0,
  );
  const shippingCost = Number(order?.shippingCost || 0);
  const total = Number(order?.totalPriceUSD || order?.totalPrice || subtotal + shippingCost || 0);

  const fullOrderId = order?._id ? String(order._id) : "";
  const shortOrderId = fullOrderId ? fullOrderId.slice(-8).toUpperCase() : null;

  const customerName = (order?.customerInfo?.name || "").trim() || "there";
  const rawEmail = (order?.customerInfo?.email || "").trim();
  const maskedEmail = rawEmail
    ? (() => {
        const [local, domain] = rawEmail.split("@");
        if (!domain) return rawEmail;
        if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
        return `${local[0]}***${local[local.length - 1]}@${domain}`;
      })()
    : "";

  return (
    <section className="flex w-full items-center justify-center bg-[var(--color-cream)]/40 px-3 py-10 sm:px-4 sm:py-14">
      <div className="w-full max-w-4xl rounded-3xl border border-[var(--color-line)] bg-white/95 px-4 py-8 shadow-[0_18px_60px_rgba(15,23,42,0.10)] sm:px-8 sm:py-10 lg:px-10">
        {/* Header: icon + main message */}
        <div className="flex flex-col gap-4 border-b border-[var(--color-line)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-green)] text-white shadow-md sm:h-11 sm:w-11">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 sm:h-6 sm:w-6"
              >
                <circle cx="12" cy="12" r="11" className="fill-[var(--color-green)]" />
                <path
                  d="M9.5 12.8 7.7 11l-.9.9 2.7 2.7 5.7-5.7-.9-.9z"
                  className="fill-white"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-[20px] font-semibold tracking-[0.03em] sm:text-[22px]">
                {t("orderSuccess.thankYou", { name: customerName })}
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-muted)]">
                {t("orderSuccess.body")}
              </p>
            </div>
          </div>

          {shortOrderId && (
            <div className="mt-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)]/60 px-4 py-3 text-end text-xs sm:mt-0 sm:min-w-[210px]">
              <p className="font-medium tracking-[0.14em] text-black/55">
                {t("orderSuccess.orderNumber")}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold">
                #ORD-{shortOrderId}
              </p>
              {maskedEmail && (
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                  {t("orderSuccess.confirmationSent", { email: maskedEmail })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Loading / error states */}
        {loading && (
          <p className="mt-8 text-center text-sm text-[var(--color-muted)]">
            {t("orderSuccess.loadingDetails")}
          </p>
        )}

        {!loading && error && (
          <p className="mt-8 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && !order && !error && (
          <p className="mt-8 text-center text-sm text-[var(--color-muted)]">
            {t("orderSuccess.loadErrorFallback")}
          </p>
        )}

        {/* Main layout: items + right column */}
        {!loading && order && (
          <div className="mt-7 grid gap-7 lg:grid-cols-[1.6fr_1.1fr]">
            {/* Items */}
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
                {t("orderSuccess.orderSummary")}
              </h2>
              <div className="mt-3 divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-white/80">
                {items.map((item) => (
                  <article
                    key={`${item.productId || "item"}-${item.size || ""}-${item.color || ""}`}
                    className="grid grid-cols-[70px_1fr_auto] gap-3 p-3.5 sm:grid-cols-[80px_1fr_auto] sm:p-4"
                  >
                    <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[var(--color-sand)]">
                      <img
                        src={item.image || "https://placehold.co/300x400?text=Sami"}
                        alt={item.name || "Product image"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[var(--color-black)]">
                        {item.name || "Item"}
                      </p>
                      {item.code && (
                        <p className="mt-0.5 font-mono text-[11px] text-black/45">
                          {item.code}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-black/55">
                        {formatSizeLabel(item.size) || "-"} / {item.color || "-"} · {t("orderSuccess.qty")}{" "}
                        {Number(item.quantity || 0)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <p className="text-[13px] font-semibold">
                        ₼
                        {(
                          Number(item.priceUSD || 0) * Number(item.quantity || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Right column: totals, shipping, next steps */}
            <div className="space-y-5">
              {/* Totals */}
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-sand)]/60 p-4 sm:p-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
                  {t("orderSuccess.paymentSummary")}
                </h2>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-black/65">{t("common.subtotal")}</span>
                    <span>₼{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/65">{t("common.shipping")}</span>
                    <span>₼{shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-[var(--color-line)] pt-2 text-[15px] font-semibold">
                    <span>{t("orderSuccess.totalPaid")}</span>
                    <span>₼{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping address */}
              <div className="rounded-2xl border border-[var(--color-line)] bg-white/90 p-4 sm:p-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
                  {t("orderSuccess.shippingAddress")}
                </h2>
                <div className="mt-3 text-sm text-black/80">
                  <p className="font-medium">
                    {(order.customerInfo?.name || "").trim() || t("orderSuccess.customer")}
                  </p>
                  <p className="mt-1">
                    {order.customerInfo?.address}
                    {order.customerInfo?.city && `, ${order.customerInfo.city}`}
                    {order.customerInfo?.state && `, ${order.customerInfo.state}`}
                    {order.customerInfo?.postalCode && ` ${order.customerInfo.postalCode}`}
                  </p>
                  <p className="mt-1">{order.customerInfo?.country}</p>
                  {order.customerInfo?.phone && (
                    <p className="mt-1 text-sm text-black/70">
                      {t("common.phone")}: {order.customerInfo.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* What happens next */}
              <div className="rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-cream)]/60 p-4 sm:p-5">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/55">
                  {t("orderSuccess.whatsNext")}
                </h2>
                <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-[var(--color-muted)]">
                  <li>• {t("orderSuccess.nextStep1")}</li>
                  <li>
                    • {t("orderSuccess.nextStep2")}{" "}
                    <span className="font-medium">{t("orderSuccess.nextStep2MyOrders")}</span>{" "}
                    {t("orderSuccess.nextStep2Or")}{" "}
                    <span className="font-medium">{t("orderSuccess.nextStep2TrackOrder")}</span>{" "}
                    {t("orderSuccess.nextStep2Page")}
                  </li>
                  <li>• {t("orderSuccess.nextStep3")}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-[var(--color-line)] pt-6">
          <Link
            href="/products"
            className="sami-btn-dark inline-flex items-center justify-center rounded-full px-7 py-3 text-xs font-semibold tracking-[0.16em] uppercase"
          >
            {t("common.continueShopping")}
          </Link>
          <Link
            href="/account?tab=orders"
            className="sami-btn-light inline-flex items-center justify-center rounded-full px-7 py-3 text-xs font-semibold tracking-[0.16em] uppercase"
          >
            {t("orderSuccess.viewMyOrders")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function OrderSuccessFallback() {
  return (
    <section className="flex w-full items-center justify-center py-10 sm:py-14">
      <div className="sami-section w-full max-w-2xl px-6 py-10 text-center sm:px-10 sm:py-12">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/60">
          Thank you
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[0.03em] sm:text-3xl">
          Your order has been placed successfully
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          Loading your order details...
        </p>
      </div>
    </section>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessFallback />}>
      <OrderSuccessInner />
    </Suspense>
  );
}
