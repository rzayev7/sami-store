export const GA_MEASUREMENT_ID = (
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""
).trim();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(...args);
}

export function sendPageView(pathWithQuery: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  const pagePath = pathWithQuery.startsWith("/")
    ? pathWithQuery
    : `/${pathWithQuery}`;

  gtag("config", GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

// ─── Shared item shape ───────────────────────────────────────────────────────

export interface GtagItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
  index?: number;
}

// Prices are stored in AZN internally; send USD to GA4 for consistency.
export function aznToUsd(amountAZN: number, aznPerUsd = 1.7): number {
  return Math.round((amountAZN / aznPerUsd) * 100) / 100;
}

export function productToItem(
  product: {
    _id?: string;
    name?: string;
    category?: string;
    priceUSD?: number;
    discountPriceUSD?: number;
  },
  overrides: Partial<GtagItem> = {}
): GtagItem {
  const hasDiscount =
    product.discountPriceUSD != null &&
    Number(product.discountPriceUSD) > 0 &&
    Number(product.discountPriceUSD) < Number(product.priceUSD ?? 0);

  return {
    item_id: String(product._id ?? ""),
    item_name: String(product.name ?? ""),
    item_category: product.category ?? undefined,
    price: hasDiscount
      ? Number(product.discountPriceUSD)
      : Number(product.priceUSD ?? 0),
    quantity: 1,
    ...overrides,
  };
}

// ─── Standard ecommerce events ───────────────────────────────────────────────

/** Fired when a product detail page is fully loaded. */
export function trackViewItem(item: GtagItem, currency = "USD") {
  gtag("event", "view_item", {
    currency,
    value: item.price ?? 0,
    items: [item],
  });
}

/** Fired when a product card link is clicked in a listing. */
export function trackSelectItem(item: GtagItem, listName = "Product List") {
  gtag("event", "select_item", {
    item_list_name: listName,
    items: [item],
  });
}

/** Fired when a product is added to cart. */
export function trackAddToCart(item: GtagItem, currency = "USD") {
  gtag("event", "add_to_cart", {
    currency,
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  });
}

/** Fired when the user lands on checkout. */
export function trackBeginCheckout(
  items: GtagItem[],
  value: number,
  currency = "USD"
) {
  gtag("event", "begin_checkout", {
    currency,
    value,
    items,
  });
}

/** Fired when the user selects / confirms a payment method. */
export function trackAddPaymentInfo(
  items: GtagItem[],
  value: number,
  paymentType: string,
  currency = "USD"
) {
  gtag("event", "add_payment_info", {
    currency,
    value,
    payment_type: paymentType,
    items,
  });
}

/** Fired on the order-success page after a confirmed order. */
export function trackPurchase(
  orderId: string,
  items: GtagItem[],
  value: number,
  shipping: number,
  currency = "USD"
) {
  gtag("event", "purchase", {
    transaction_id: orderId,
    currency,
    value,
    shipping,
    items,
  });
}
