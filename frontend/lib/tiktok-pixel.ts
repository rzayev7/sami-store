import type { GtagItem } from "./gtag";

/**
 * TikTok Pixel ID (Events API / Web Pixel sdkid).
 * Set `NEXT_PUBLIC_TIKTOK_PIXEL_ID` to override, or `""` to disable.
 */
const raw = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
export const TIKTOK_PIXEL_ID =
  raw !== undefined ? raw.trim() : "D80QN4JC77UDOFSGH1EG";

/** sessionStorage key prefix — stable per `orderId`, aligns with TikTok `event_id` dedupe. */
export const TTQ_PURCHASE_SESSION_PREFIX = "ttq_purchase_sent_";

const ANON_EXTERNAL_STORAGE_KEY = "sami_tiktok_anon_external_id";

/** First-party id for Advanced Matching when no account email/phone is available (hashed before `identify`). */
export function getOrCreateTikTokAnonymousExternalId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(ANON_EXTERNAL_STORAGE_KEY);
    if (existing?.trim()) return existing.trim();
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
    localStorage.setItem(ANON_EXTERNAL_STORAGE_KEY, id);
    return id;
  } catch {
    return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

declare global {
  interface Window {
    ttq?: {
      page?: (...args: unknown[]) => void;
      identify?: (data: Record<string, string>) => void;
      track?: (
        event: string,
        params?: Record<string, unknown>,
        options?: { event_id?: string },
      ) => void;
    };
  }
}

function getTtq() {
  if (!TIKTOK_PIXEL_ID || typeof window === "undefined") return null;
  return window.ttq ?? null;
}

export async function sha256Hex(text: string): Promise<string> {
  const normalized = text.trim();
  if (!normalized) return "";
  const enc = new TextEncoder().encode(normalized);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmailForHash(email: string): string {
  return email.trim().toLowerCase();
}

/** Digits only — common normalization before hashing phone for ads pixels. */
function normalizePhoneForHash(phone: string): string {
  return phone.replace(/\D/g, "");
}

export type TikTokIdentifyInput = {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
};

/**
 * Hashed PII for `ttq.identify` (SHA-256 hex, client-side).
 * TikTok: call before conversion-oriented events where advanced matching applies.
 *
 * When email and phone are both absent, a stable first-party `external_id` is still sent
 * (anonymous id from {@link getOrCreateTikTokAnonymousExternalId}) so matching is not empty.
 * Public IP and user agent are not readable in JS; TikTok’s pixel requests still carry normal
 * connection metadata over HTTPS (see TikTok “Advanced Matching for Web” / Automatic Advanced Matching).
 */
export async function identifyTikTokFromRaw(
  options: TikTokIdentifyInput,
): Promise<void> {
  if (!TIKTOK_PIXEL_ID || typeof window === "undefined") return;
  const ttq = getTtq();
  if (!ttq?.identify) return;

  const payload: Record<string, string> = {};

  const emailRaw = options.email?.trim();
  if (emailRaw) {
    const hashed = await sha256Hex(normalizeEmailForHash(emailRaw));
    if (hashed) payload.email = hashed;
  }

  const phoneRaw = options.phone?.trim();
  if (phoneRaw) {
    const digits = normalizePhoneForHash(phoneRaw);
    if (digits) {
      const hashed = await sha256Hex(digits);
      if (hashed) payload.phone_number = hashed;
    }
  }

  let idToHash = options.externalId?.trim();
  if (!idToHash && !emailRaw && !phoneRaw) {
    idToHash = getOrCreateTikTokAnonymousExternalId();
  }
  if (idToHash) {
    const hashed = await sha256Hex(idToHash);
    if (hashed) payload.external_id = hashed;
  }

  if (Object.keys(payload).length === 0) return;
  ttq.identify(payload);
}

/**
 * Runs `ttq.identify` (hashed PII and/or anonymous `external_id`), then the pixel event.
 * Matches TikTok guidance: identify before `ViewContent`, checkout, purchase, etc.
 */
export async function identifyThenRun(
  identify: TikTokIdentifyInput,
  run: () => void,
): Promise<void> {
  try {
    await identifyTikTokFromRaw(identify);
  } catch {
    /* best-effort */
  }
  run();
}

async function eventIdFromSeed(seed: string): Promise<string> {
  return sha256Hex(`${TIKTOK_PIXEL_ID}:${seed}`);
}

function itemToTikTokContent(item: GtagItem) {
  return {
    content_id:   String(item.item_id   ?? ""),
    content_type: "product" as const,
    content_name: String(item.item_name ?? ""),
    // TikTok requires quantity + price on each content object for Purchase /
    // AddToCart / InitiateCheckout events. Without them the event is accepted
    // but excluded from value-based optimisation (Performance Max, Value ROAS).
    quantity: Number(item.quantity ?? 1),
    price:    Number(item.price    ?? 0),
  };
}

function lineValue(item: GtagItem): number {
  const qty = Number(item.quantity ?? 1);
  const price = Number(item.price ?? 0);
  return Math.round(price * qty * 100) / 100;
}

function emitTrack(
  eventName: string,
  params: Record<string, unknown>,
  eventIdSeed: string,
): void {
  if (!TIKTOK_PIXEL_ID) return;
  const ttq = getTtq();
  if (!ttq?.track) return;
  void eventIdFromSeed(eventIdSeed).then((event_id) => {
    const t = getTtq();
    if (!t?.track) return;
    t.track(eventName, params, { event_id });
  });
}

/** Client-side route change (initial load is covered by the bootstrap snippet). */
export function trackTikTokPage() {
  if (!TIKTOK_PIXEL_ID || typeof window === "undefined") return;
  const { ttq } = window;
  if (!ttq || typeof ttq.page !== "function") return;
  ttq.page();
}

export function trackTikTokViewContent(
  item: GtagItem,
  currency = "USD",
  seed?: string,
) {
  const value = lineValue({ ...item, quantity: item.quantity ?? 1 });
  const id = seed ?? `view_${item.item_id}_${value}`;
  emitTrack(
    "ViewContent",
    {
      contents: [itemToTikTokContent(item)],
      value,
      currency,
    },
    id,
  );
}

export function trackTikTokAddToWishlist(item: GtagItem, currency = "USD") {
  const value = lineValue(item);
  emitTrack(
    "AddToWishlist",
    {
      contents: [itemToTikTokContent(item)],
      value,
      currency,
    },
    `wishlist_${item.item_id}_${Date.now()}`,
  );
}

export function trackTikTokSearch(
  searchString: string,
  options?: { items?: GtagItem[]; currency?: string },
) {
  const q = searchString.trim();
  if (!q) return;
  const items = options?.items ?? [];
  const currency = options?.currency ?? "USD";
  const contents = items.slice(0, 20).map(itemToTikTokContent);
  const value = items.reduce((sum, it) => sum + lineValue(it), 0);
  emitTrack(
    "Search",
    {
      contents,
      value: Math.round(value * 100) / 100,
      currency,
      search_string: q,
    },
    `search_${q.slice(0, 120)}_${Date.now()}`,
  );
}

export function trackTikTokAddPaymentInfo(
  items: GtagItem[],
  value: number,
  currency = "USD",
  seed?: string,
) {
  if (!items.length) return;
  const id = seed ?? `addpay_${Date.now()}`;
  emitTrack(
    "AddPaymentInfo",
    {
      contents: items.map(itemToTikTokContent),
      value: Math.round(Number(value) * 100) / 100,
      currency,
    },
    id,
  );
}

export function trackTikTokAddToCart(item: GtagItem, currency = "USD") {
  const value = lineValue(item);
  emitTrack(
    "AddToCart",
    {
      contents: [itemToTikTokContent(item)],
      value,
      currency,
      num_items: Number(item.quantity ?? 1),
    },
    `cart_${item.item_id}_${item.quantity ?? 1}_${Date.now()}`,
  );
}

export function trackTikTokInitiateCheckout(
  items: GtagItem[],
  value: number,
  currency = "USD",
) {
  if (!items.length) return;
  const numItems = items.reduce((sum, it) => sum + Number(it.quantity ?? 1), 0);
  emitTrack(
    "InitiateCheckout",
    {
      contents: items.map(itemToTikTokContent),
      value: Math.round(Number(value) * 100) / 100,
      currency,
      num_items: numItems,
    },
    `checkout_${items.map((i) => i.item_id).join(",")}_${Math.round(Number(value) * 100)}`,
  );
}

export function trackTikTokCompleteRegistration(currency = "USD") {
  emitTrack(
    "CompleteRegistration",
    {
      contents: [],
      value: 0,
      currency,
    },
    `complete_reg_${Date.now()}`,
  );
}

/**
 * Single web conversion for an order: deduped in `sessionStorage` and with a stable
 * `event_id` derived from `orderId` (via {@link emitTrack} seed `purchase_${orderId}`).
 *
 * Includes `num_items` and per-item `quantity` + `price` as required by TikTok's
 * Purchase event spec for value-based campaign optimisation.
 */
export function trackTikTokPurchase(
  items: GtagItem[],
  value: number,
  orderId: string,
  currency = "USD",
) {
  if (!items.length || !orderId) return;
  try {
    if (typeof sessionStorage !== "undefined") {
      const k = `${TTQ_PURCHASE_SESSION_PREFIX}${orderId}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    }
  } catch {
    /* private mode / blocked storage — still send one client hit */
  }
  const numItems = items.reduce((sum, it) => sum + Number(it.quantity ?? 1), 0);
  emitTrack(
    "Purchase",
    {
      contents:  items.map(itemToTikTokContent),
      value:     Math.round(Number(value) * 100) / 100,
      currency,
      num_items: numItems,
    },
    `purchase_${orderId}`,
  );
}
