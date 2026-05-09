"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Loader2 } from "lucide-react";
import api from "../../../../lib/api";
import { getCustomerAuthHeaders } from "../../../../lib/customerAuth";

export default function InvoicePage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/orders/${id}`, { headers: getCustomerAuthHeaders() })
      .then(({ data }) => setOrder(data))
      .catch(() => setError("Order not found or access denied."));
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-black/30" size={24} />
      </div>
    );
  }

  const subtotal = order.items?.reduce(
    (s, i) => s + Number(i.priceUSD || 0) * Number(i.quantity || 1),
    0
  ) ?? 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Print button — hidden when printing */}
      <div className="flex justify-end px-8 py-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-4 py-2 text-[12px] font-medium text-black/70 transition hover:bg-black/5"
        >
          <Printer size={14} strokeWidth={1.8} />
          Print / Save PDF
        </button>
      </div>

      {/* Invoice */}
      <div className="mx-auto max-w-2xl px-8 pb-16 pt-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-[0.06em]">SAMÍ</h1>
            <p className="mt-0.5 text-[11px] text-black/40">wearsamiofficial.com</p>
          </div>
          <div className="text-end">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-black/40">Invoice</p>
            <p className="mt-0.5 text-[15px] font-medium">
              #{String(order._id).slice(-8).toUpperCase()}
            </p>
            <p className="mt-0.5 text-[12px] text-black/50">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <hr className="my-6 border-black/10" />

        {/* Bill to */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Bill To</p>
            <p className="text-[13px] font-medium">{order.customerInfo?.name}</p>
            <p className="text-[12px] text-black/55">{order.customerInfo?.email}</p>
            <p className="text-[12px] text-black/55">{order.customerInfo?.phone}</p>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Ship To</p>
            <p className="text-[13px]">{order.customerInfo?.address}</p>
            {order.customerInfo?.city && (
              <p className="text-[12px] text-black/55">
                {order.customerInfo.city}
                {order.customerInfo.state && `, ${order.customerInfo.state}`}
                {order.customerInfo.postalCode && ` ${order.customerInfo.postalCode}`}
              </p>
            )}
            <p className="text-[12px] text-black/55">{order.customerInfo?.country}</p>
          </div>
        </div>

        <hr className="my-6 border-black/10" />

        {/* Order status */}
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
            {order.status}
          </span>
          {order.trackingNumber && (
            <span className="text-[12px] text-black/50">
              Tracking: <span className="font-medium text-black">{order.trackingNumber}</span>
            </span>
          )}
        </div>

        {/* Line items */}
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-black/10 text-[10px] uppercase tracking-[0.14em] text-black/40">
              <th className="pb-2 text-start font-semibold">Item</th>
              <th className="pb-2 text-center font-semibold">Qty</th>
              <th className="pb-2 text-end font-semibold">Price</th>
              <th className="pb-2 text-end font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {order.items?.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3">
                  <p className="font-medium">{item.name}</p>
                  {(item.size || item.color) && (
                    <p className="mt-0.5 text-[11px] text-black/40">
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="py-3 text-center text-black/60">{item.quantity}</td>
                <td className="py-3 text-end text-black/60">${Number(item.priceUSD).toFixed(2)}</td>
                <td className="py-3 text-end font-medium">
                  ${(Number(item.priceUSD) * Number(item.quantity)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 space-y-1.5 border-t border-black/10 pt-4">
          <div className="flex justify-between text-[13px] text-black/60">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {Number(order.shippingCost) > 0 && (
            <div className="flex justify-between text-[13px] text-black/60">
              <span>Shipping</span>
              <span>${Number(order.shippingCost).toFixed(2)}</span>
            </div>
          )}
          {order.couponCode && (
            <div className="flex justify-between text-[13px] text-emerald-600">
              <span>Coupon ({order.couponCode})</span>
              <span>-${(subtotal + Number(order.shippingCost || 0) - Number(order.totalPriceUSD)).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-black/10 pt-2 text-[15px] font-semibold">
            <span>Total</span>
            <span>${Number(order.totalPriceUSD).toFixed(2)}</span>
          </div>
        </div>

        <hr className="my-8 border-black/10" />

        <p className="text-center text-[11px] text-black/30">
          Thank you for shopping with SAMÍ · support@wearsamiofficial.com
        </p>
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } }`}</style>
    </div>
  );
}
