"use client";

import Image from "next/image";
import Link from "./LocaleLink";
import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useLanguage } from "../context/LanguageContext";
import { cloudinaryOptimizedUrl, isCloudinaryUrl } from "../lib/image";
import { formatSizeLabel } from "../lib/sizeDisplay";

const FREE_SHIPPING_THRESHOLD = 150;

function QuantityStepper({ quantity, onDecrement, onIncrement, t }) {
  return (
    <div className="inline-flex items-center border border-[var(--color-line)] rounded-full">
      <button
        type="button"
        onClick={onDecrement}
        aria-label={t("cart.decreaseQty")}
        className="flex h-7 w-7 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
      >
        <Minus size={12} strokeWidth={2} />
      </button>
      <span className="min-w-[28px] text-center text-xs font-medium tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={t("cart.increaseQty")}
        className="flex h-7 w-7 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
      >
        <Plus size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

function CartItem({ item, onUpdateQuantity, onRemove, formatPrice, t }) {
  const lineTotal = Number(item.priceUSD || 0) * Number(item.quantity || 0);
  const rawImage = item.image || "https://placehold.co/300x400?text=Sami";
  const imageSrc = cloudinaryOptimizedUrl(rawImage, { preset: "cart" });
  const imageIsCloudinary = isCloudinaryUrl(rawImage);

  return (
    <article className="group relative grid grid-cols-[80px_1fr] gap-4 py-5">
      <Link
        href={`/products/${item.productId}`}
        className="aspect-[3/4] overflow-hidden rounded-md bg-[var(--color-sand)]"
      >
        <Image
          src={imageSrc}
          alt={item.name || "Cart item"}
          width={80}
          height={107}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized={imageIsCloudinary}
          quality={90}
        />
      </Link>

      <div className="flex flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/products/${item.productId}`}
              className="text-[13px] font-medium leading-snug tracking-[0.01em] transition-colors hover:text-black/60"
            >
              {item.name}
            </Link>
            <button
              type="button"
              onClick={() => onRemove(item.productId, item.size, item.color, item.bundle)}
              aria-label={`Remove ${item.name}`}
              className="mt-0.5 flex-shrink-0 rounded-full p-1 text-black/30 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 size={14} strokeWidth={1.8} />
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            {item.size && (
              <p className="text-[11px] tracking-[0.04em] text-black/45">
                {t("cart.size")} {formatSizeLabel(item.size)}
              </p>
            )}
            {item.bundle && (
              <p className="text-[11px] tracking-[0.04em] text-black/45">
                {t("cart.type")} {item.bundle}
              </p>
            )}
            {item.color && (
              <p className="text-[11px] tracking-[0.04em] text-black/45">
                {t("cart.color")} {item.color}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <QuantityStepper
            quantity={item.quantity}
            t={t}
            onDecrement={() =>
              onUpdateQuantity(
                item.productId,
                item.size,
                item.quantity - 1,
                item.color,
                item.bundle
              )
            }
            onIncrement={() =>
              onUpdateQuantity(
                item.productId,
                item.size,
                item.quantity + 1,
                item.color,
                item.bundle
              )
            }
          />
          <div className="text-end">
            <p className="text-[13px] font-semibold tracking-[0.01em]">
              {formatPrice(lineTotal)}
            </p>
            {item.originalPriceUSD != null &&
              Number(item.originalPriceUSD) > Number(item.priceUSD) && (
              <p className="text-[10px] text-black/30 line-through">
                {formatPrice(Number(item.originalPriceUSD) * Number(item.quantity || 0))}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CartDrawer() {
  const pathname = usePathname();
  const { cartItems, isCartOpen, closeCart, removeFromCart, updateQuantity } =
    useCart();
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const drawerRef = useRef(null);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + Number(item.priceUSD || 0) * Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const shippingProgress = Math.min(
    (subtotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );
  const amountToFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  useEffect(() => {
    if (!isCartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isCartOpen]);

  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  useEffect(() => {
    if (!isCartOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isCartOpen, closeCart]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isCartOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("cart.shoppingCart")}
        className={`fixed top-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ltr:right-0 rtl:left-0 ${
          isCartOpen ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={18} strokeWidth={1.6} className="text-black/70" />
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.16em]">
              {t("cart.yourBag")}
              <span className="ms-1.5 font-normal text-black/40">
                ({itemCount})
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t("cart.closeCart")}
            className="rounded-full p-1.5 text-black/50 transition-colors hover:bg-black/5 hover:text-black"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* Free shipping bar */}
        {cartItems.length > 0 && (
          <div className="border-b border-[var(--color-line)] px-6 py-3.5">
            <p className="text-center text-[11px] tracking-[0.03em] text-black/55">
              {amountToFreeShipping > 0 ? (
                t("cart.awayFromFree", { amount: formatPrice(amountToFreeShipping) })
              ) : (
                <span className="font-medium text-[var(--color-green)]">
                  {t("cart.freeShippingUnlocked")}
                </span>
              )}
            </p>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[var(--color-green)] transition-all duration-500 ease-out"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pb-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-sand)]/60">
                <ShoppingBag
                  size={30}
                  strokeWidth={1.2}
                  className="text-black/25"
                />
              </div>
              <p className="mt-5 text-[13px] font-medium tracking-[0.02em] text-black/70">
                {t("cart.emptyTitle")}
              </p>
              <p className="mt-1.5 text-[12px] tracking-[0.02em] text-black/40">
                {t("cart.emptySubtitle")}
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className="mt-7 inline-flex border-b border-black pb-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-black transition-colors hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
              >
                {t("common.continueShopping")}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {cartItems.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.size}-${item.color || ""}-${item.bundle || ""}`}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                  formatPrice={formatPrice}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-[var(--color-line)] bg-[var(--color-sand)]/30 px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] uppercase tracking-[0.12em] text-black/50">
                {t("common.subtotal")}
              </span>
              <span className="text-[15px] font-semibold tracking-[0.01em]">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] tracking-[0.02em] text-black/35">
              {t("cart.shippingTaxNote")}
            </p>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="sami-btn-dark mt-4 flex w-full items-center justify-center gap-2 px-4 py-3.5 text-[12px] uppercase tracking-[0.16em]"
            >
              {t("cart.checkout")}
            </Link>

            <button
              type="button"
              onClick={closeCart}
              className="mt-2.5 w-full text-center text-[11px] tracking-[0.04em] text-black/40 transition-colors hover:text-black/70"
            >
              {t("cart.orContinue")}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
