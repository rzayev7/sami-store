"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useAuth } from "../../context/AuthContext";
import { useLanguage, useLocalePath } from "../../context/LanguageContext";
import api from "../../lib/api";
import { getCustomerAuthHeaders } from "../../lib/customerAuth";
import BankTransferDetails from "../../components/BankTransferDetails";
import { formatSizeLabel } from "../../lib/sizeDisplay";
import { MastercardMark, VisaMark } from "../../components/CardBrandLogos";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium",
  "Bolivia","Bosnia and Herzegovina","Brazil","Brunei","Bulgaria","Cambodia",
  "Canada","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus",
  "Czech Republic","Denmark","Dominican Republic","Ecuador","Egypt","Estonia",
  "Ethiopia","Finland","France","Georgia","Germany","Ghana","Greece","Guatemala",
  "Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait",
  "Kyrgyzstan","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Malaysia",
  "Maldives","Malta","Mexico","Moldova","Monaco","Mongolia","Montenegro",
  "Morocco","Netherlands","New Zealand","Nigeria","North Macedonia","Norway",
  "Oman","Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Saudi Arabia","Serbia","Singapore","Slovakia",
  "Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sweden",
  "Switzerland","Taiwan","Tajikistan","Thailand","Tunisia","Turkey",
  "Turkmenistan","UAE","Uganda","Ukraine","United Kingdom","United States",
  "Uruguay","Uzbekistan","Venezuela","Vietnam",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user: customerUser } = useAuth();
  const { t } = useLanguage();
  const localePath = useLocalePath();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.priceUSD || 0) * Number(item.quantity || 0),
      0
    );
  }, [cartItems]);
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage) / 100 : 0;
  const shippingCost = 0;
  const totalPrice = subtotal - discountAmount + shippingCost;

  const handleApplyCoupon = async () => {
    const code = String(couponCode || "").trim().toUpperCase();
    if (!code) {
      setCouponError(t("checkout.enterCoupon"));
      return;
    }
    setCouponError("");
    setCouponLoading(true);
    try {
      const { data } = await api.get(`/api/coupons/validate/${encodeURIComponent(code)}`);
      if (data.valid) {
        setAppliedCoupon({ code: data.code, discountPercentage: data.discountPercentage });
      } else {
        setAppliedCoupon(null);
        setCouponError(data.message || t("checkout.invalidCoupon"));
      }
    } catch {
      setAppliedCoupon(null);
      setCouponError(t("checkout.couponValidationError"));
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    if (cartItems.length === 0 && !hasPlacedOrder) {
      router.replace(localePath("/products"));
    }
  }, [cartItems, router, hasPlacedOrder]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const fd = new FormData(event.currentTarget);
    const val = (key) => String(fd.get(key) || "").trim();

    const firstName = val("firstName");
    const lastName = val("lastName");
    const country = val("country");
    const city = val("city");
    const fullAddress = val("address");
    const mobile = val("mobile");
    const email = val("email");
    const postalCode = val("postalCode");
    const orderNotesRaw = (fd.get("orderNotes") ?? "").toString();

    const orderPayload = {
      customerInfo: {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone: mobile,
        country,
        city,
        address: fullAddress,
        postalCode,
      },
      items: cartItems.map((item) => ({
        productId: item.productId,
        code: item.code || "",
        name: item.name,
        priceUSD: Number(item.priceUSD || 0),
        quantity: Number(item.quantity || 0),
        size: item.bundle ? `${item.bundle} | ${item.size}` : item.size,
        color: item.color || "",
        image: item.image,
      })),
      totalPriceUSD: Number(totalPrice.toFixed(2)),
      shippingCost,
      paymentMethod: "bank_transfer",
      ...(orderNotesRaw.trim() && { orderNotes: orderNotesRaw.trim() }),
      ...(appliedCoupon && { couponCode: appliedCoupon.code }),
    };

    try {
      setIsPlacingOrder(true);
      const headers = customerUser ? getCustomerAuthHeaders() : {};
      const { data } = await api.post("/api/orders", orderPayload, { headers });
      const orderId = data?._id || data?.id || data?.order?._id;
      if (!orderId) throw new Error("Order created but no order id returned");

      setHasPlacedOrder(true);
      clearCart();
      router.replace(
        localePath(`/payment/bank-transfer?orderId=${encodeURIComponent(String(orderId))}&email=${encodeURIComponent(
          email
        )}`)
      );
    } catch (error) {
      const message = error?.response?.data?.message
        ? error.response.data.message
        : error?.message || t("checkout.orderError");
      setErrorMessage(message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0 && !hasPlacedOrder) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-7">
          <div>
            <h1 className="text-2xl font-semibold tracking-[0.03em]">{t("checkout.title")}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {t("checkout.subtitle")}
            </p>
          </div>

          {/* Contact — email only */}
          <fieldset className="space-y-3 rounded-xl border border-[var(--color-line)] bg-white p-5">
            <legend className="px-2 text-sm font-semibold uppercase tracking-[0.12em]">
              {t("checkout.contactInfo")}
            </legend>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t("checkout.emailPlaceholder")}
              className="sami-input"
            />
          </fieldset>

          {/* Delivery */}
          <fieldset className="space-y-3 rounded-xl border border-[var(--color-line)] bg-white p-5">
            <legend className="px-2 text-sm font-semibold uppercase tracking-[0.12em]">
              {t("checkout.shippingAddress")}
            </legend>

            <div>
              <select name="country" required defaultValue="" autoComplete="country-name" className="sami-input">
                <option value="" disabled>
                  {t("checkout.countryPlaceholder")}
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input name="firstName" type="text" required autoComplete="given-name" placeholder={t("checkout.firstNamePlaceholder")} className="sami-input" />
              <input name="lastName" type="text" required autoComplete="family-name" placeholder={t("checkout.lastNamePlaceholder")} className="sami-input" />
            </div>

            <input name="address" type="text" required autoComplete="street-address" placeholder={t("checkout.addressPlaceholder")} className="sami-input" />

            <div className="grid gap-3 sm:grid-cols-2">
              <input name="city" type="text" required autoComplete="address-level2" placeholder={t("checkout.cityPlaceholder")} className="sami-input" />
              <input name="postalCode" type="text" autoComplete="postal-code" placeholder={t("checkout.postalCodePlaceholder")} className="sami-input" />
            </div>

            <input
              name="mobile"
              type="tel"
              required
              autoComplete="tel"
              aria-describedby="checkout-phone-hint"
              placeholder={t("checkout.phonePlaceholder")}
              className="sami-input"
            />
            <p id="checkout-phone-hint" className="text-xs text-[var(--color-muted)]">
              {t("checkout.phoneHint")}
            </p>
          </fieldset>

          {/* Order notes */}
          <fieldset className="space-y-3 rounded-xl border border-[var(--color-line)] bg-white p-5">
            <legend className="px-2 text-sm font-semibold uppercase tracking-[0.12em]">
              {t("checkout.orderNotes")}
            </legend>
            <textarea
              name="orderNotes"
              rows={3}
              className="sami-input min-h-[80px] resize-y text-sm"
              placeholder={t("checkout.orderNotesPlaceholder")}
              maxLength={2000}
            />
          </fieldset>

          {/* Payment */}
          <fieldset className="space-y-3 rounded-xl border border-[var(--color-line)] bg-white p-5">
            <legend className="px-2 text-sm font-semibold uppercase tracking-[0.12em]">{t("checkout.payment")}</legend>

            <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-sand)]/40 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{t("checkout.creditCard")}</span>
                <div className="flex items-center gap-2">
                  <VisaMark className="h-6 w-auto" />
                  <MastercardMark className="h-6 w-auto" />
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {t("checkout.cardNotAvailable")}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">{t("checkout.bankTransfer")}</p>
              <BankTransferDetails />
            </div>
          </fieldset>
        </form>

        {/* Order Summary */}
        <aside className="h-fit rounded-2xl border border-[var(--color-line)] bg-white p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">{t("checkout.orderSummary")}</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {cartItems.length} {cartItems.length !== 1 ? t("common.items") : t("common.item")}
          </p>
          <div className="mt-4 space-y-3">
            {cartItems.map((item) => (
              <article
                key={`${item.productId}-${item.size}-${item.color || ""}-${item.bundle || ""}`}
                className="grid grid-cols-[58px_1fr_auto] gap-2.5 rounded-md border border-[var(--color-line)] p-2"
              >
                <div className="aspect-[3/4] overflow-hidden rounded bg-[var(--color-sand)]">
                  <img
                    src={item.image || "https://placehold.co/300x400?text=Sami"}
                    alt={item.name || "Product image"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  {item.code && <p className="text-[11px] font-mono text-black/50">{item.code}</p>}
                  <p className="text-xs uppercase tracking-[0.1em] text-black/70">
                    {item.bundle ? `${item.bundle} · ` : ""}
                    {formatSizeLabel(item.size) || "-"} / {item.color || "-"} x {item.quantity}
                  </p>
                </div>
                <p className="whitespace-nowrap text-sm font-medium">
                  {formatPrice(Number(item.priceUSD || 0) * Number(item.quantity || 0))}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder={t("checkout.discountCode")}
                className="sami-input flex-1 text-sm"
                disabled={!!appliedCoupon}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !!appliedCoupon}
                className="sami-btn-dark shrink-0 px-3 py-2 text-sm"
              >
                {couponLoading ? "..." : appliedCoupon ? t("checkout.applied") : t("checkout.apply")}
              </button>
            </div>
            {couponError && <p className="text-xs text-red-600">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-xs text-green-600">
                {appliedCoupon.code}: {appliedCoupon.discountPercentage}% {t("checkout.off")}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-[var(--color-line)] pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span>{t("common.subtotal")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between text-green-600">
                <span>{t("checkout.discount")} ({appliedCoupon.code})</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>{t("common.shipping")}</span>
              <span>{shippingCost > 0 ? formatPrice(shippingCost) : t("checkout.calculatedAtDelivery")}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-base font-semibold">
              <span>{t("common.total")}</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={isPlacingOrder}
            className="sami-btn-dark mt-5 w-full px-4 py-3.5 text-sm"
          >
            {isPlacingOrder ? t("common.processing") : t("checkout.placeOrder")}
          </button>

          {errorMessage && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
