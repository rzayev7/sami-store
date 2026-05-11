import type { GtagItem } from "./gtag";

/**
 * Meta (Facebook) Pixel ID.
 * Defaults to the production pixel. Set `NEXT_PUBLIC_META_PIXEL_ID` to override, or `""` to disable.
 * Standard events: https://www.facebook.com/business/help/402791146561655
 */
const raw = process.env.NEXT_PUBLIC_META_PIXEL_ID;
export const META_PIXEL_ID =
  raw !== undefined ? raw.trim() : "1298917032196278";

/** sessionStorage — one Purchase per order id in-browser. */
export const META_PURCHASE_SESSION_PREFIX = "meta_purchase_sent_";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fbqTrack(eventName: string, params?: Record<string, unknown>) {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  if (params && Object.keys(params).length > 0) {
    window.fbq("track", eventName, params);
  } else {
    window.fbq("track", eventName);
  }
}

function lineValue(item: GtagItem): number {
  const qty = Number(item.quantity ?? 1);
  const price = Number(item.price ?? 0);
  return Math.round(price * qty * 100) / 100;
}

function itemsToMetaPayload(items: GtagItem[], currency: string) {
  const contents = items.map((i) => ({
    id: String(i.item_id ?? ""),
    quantity: Number(i.quantity ?? 1),
    item_price: Number(i.price ?? 0),
    ...(i.item_name ? { title: i.item_name } : {}),
  }));
  const content_ids = items.map((i) => String(i.item_id ?? ""));
  const value = Math.round(
    items.reduce((s, i) => s + lineValue(i), 0) * 100,
  ) / 100;
  const num_items = items.reduce((s, i) => s + Number(i.quantity ?? 1), 0);
  return {
    content_type: "product",
    content_ids,
    contents,
    value,
    currency,
    num_items,
  };
}

/** Client-side route change (initial load is covered by the bootstrap snippet). */
export function trackMetaPageView() {
  if (!META_PIXEL_ID || typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  window.fbq("track", "PageView");
}

export function trackMetaViewContent(item: GtagItem, currency = "USD") {
  const value = lineValue({ ...item, quantity: item.quantity ?? 1 });
  fbqTrack("ViewContent", {
    content_ids: [String(item.item_id ?? "")],
    content_type: "product",
    contents: [
      {
        id: String(item.item_id ?? ""),
        quantity: Number(item.quantity ?? 1),
        item_price: Number(item.price ?? 0),
        ...(item.item_name ? { title: item.item_name } : {}),
      },
    ],
    value,
    currency,
  });
}

export function trackMetaAddToCart(item: GtagItem, currency = "USD") {
  fbqTrack("AddToCart", itemsToMetaPayload([item], currency));
}

export function trackMetaAddToWishlist(item: GtagItem, currency = "USD") {
  fbqTrack("AddToWishlist", itemsToMetaPayload([item], currency));
}

export function trackMetaSearch(searchString: string, currency = "USD") {
  const q = searchString.trim();
  if (!q) return;
  fbqTrack("Search", { search_string: q, currency });
}

export function trackMetaInitiateCheckout(
  items: GtagItem[],
  value: number,
  currency = "USD",
) {
  if (!items.length) return;
  const base = itemsToMetaPayload(items, currency);
  fbqTrack("InitiateCheckout", {
    ...base,
    value: Math.round(Number(value) * 100) / 100,
  });
}

export function trackMetaAddPaymentInfo(
  items: GtagItem[],
  value: number,
  currency = "USD",
) {
  if (!items.length) return;
  const base = itemsToMetaPayload(items, currency);
  fbqTrack("AddPaymentInfo", {
    ...base,
    value: Math.round(Number(value) * 100) / 100,
  });
}

export function trackMetaCompleteRegistration() {
  fbqTrack("CompleteRegistration");
}

/**
 * `Purchase` — primary web conversion; deduped per `orderId` in sessionStorage.
 */
export function trackMetaPurchase(
  items: GtagItem[],
  value: number,
  orderId: string,
  currency = "USD",
) {
  if (!items.length || !orderId) return;
  try {
    if (typeof sessionStorage !== "undefined") {
      const k = `${META_PURCHASE_SESSION_PREFIX}${orderId}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    }
  } catch {
    /* allow single hit if storage blocked */
  }
  const base = itemsToMetaPayload(items, currency);
  fbqTrack("Purchase", {
    ...base,
    value: Math.round(Number(value) * 100) / 100,
  });
}
