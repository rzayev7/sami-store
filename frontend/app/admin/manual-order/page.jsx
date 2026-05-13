"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Copy,
  Check,
  MessageCircle,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import StatusBadge from "../../../components/admin/StatusBadge";
import { cloudinaryOptimizedUrl, isCloudinaryUrl } from "../../../lib/image";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium",
  "Bolivia","Brazil","Bulgaria","Cambodia","Canada","Chile","China","Colombia",
  "Croatia","Cyprus","Czech Republic","Denmark","Egypt","Estonia","Finland",
  "France","Georgia","Germany","Ghana","Greece","Hungary","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan","Kazakhstan","Kenya",
  "Kuwait","Kyrgyzstan","Latvia","Lebanon","Lithuania","Malaysia","Mexico",
  "Moldova","Morocco","Netherlands","New Zealand","Nigeria","Norway","Oman",
  "Pakistan","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Saudi Arabia","Serbia","Singapore","Slovakia","South Africa","South Korea",
  "Spain","Sri Lanka","Sweden","Switzerland","Taiwan","Tajikistan","Thailand",
  "Tunisia","Turkey","Turkmenistan","UAE","Ukraine","United Kingdom","United States",
  "Uzbekistan","Vietnam",
];

const EMPTY_CUSTOMER = {
  name: "", email: "", phone: "", country: "",
  address: "", city: "", postalCode: "", state: "",
};

const unitPrice = (p) => {
  const base = Number(p?.priceUSD || 0);
  const disc = Number(p?.discountPriceUSD || 0);
  return disc > 0 && disc < base ? disc : base;
};

/* ── tiny helpers ── */
function Label({ children, required }) {
  return (
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-black/45">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function Input({ ...props }) {
  return <input className="sami-input" {...props} />;
}

function Select({ children, ...props }) {
  return <select className="sami-input" {...props}>{children}</select>;
}

export default function ManualOrderPage() {
  const [products, setProducts]           = useState([]);
  const [productsLoading, setPL]          = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [customer, setCustomer]           = useState(EMPTY_CUSTOMER);
  const [items, setItems]                 = useState([]);
  const [shippingCost, setShippingCost]   = useState("0");
  const [orderNotes, setOrderNotes]       = useState("");
  const [creating, setCreating]           = useState(false);
  const [error, setError]                 = useState("");
  const [createdOrder, setCreatedOrder]   = useState(null);
  const [paymentLink, setPaymentLink]     = useState("");
  const [copyState, setCopyState]         = useState("");

  useEffect(() => {
    api.get("/api/products")
      .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setPL(false));
  }, []);

  /* ── cart helpers ── */
  const addProduct = (p) =>
    setItems((prev) => {
      const hit = prev.find((i) => i.productId === p._id);
      if (hit) return prev.map((i) => i.productId === p._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        productId: p._id, name: p.name, code: p.code || "",
        image: p.images?.[0] || "", quantity: 1, priceUSD: unitPrice(p),
      }];
    });

  const changeQty = (id, d) =>
    setItems((prev) => prev
      .map((i) => i.productId === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i)
      .filter((i) => i.quantity > 0));

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.productId !== id));

  const cf = (field) => (e) => setCustomer((prev) => ({ ...prev, [field]: e.target.value }));

  /* ── totals ── */
  const subtotal = items.reduce((s, i) => s + i.priceUSD * i.quantity, 0);
  const shipping = Math.max(0, Number(shippingCost) || 0);
  const total    = subtotal + shipping;

  /* ── filtered product list ── */
  const filtered = products.filter((p) => {
    const q = productSearch.trim().toLowerCase();
    return !q ||
      String(p?.name || "").toLowerCase().includes(q) ||
      String(p?.code || "").toLowerCase().includes(q);
  });

  /* ── submit ── */
  const handleCreate = async () => {
    setError("");
    if (!items.length) { setError("Добавьте хотя бы один товар."); return; }
    const fieldLabels = { name:"Имя", email:"Email", phone:"Телефон", country:"Страна", address:"Адрес", city:"Город", postalCode:"Индекс" };
    const missing = Object.keys(fieldLabels).find((f) => !String(customer[f] || "").trim());
    if (missing) { setError(`Обязательное поле: ${fieldLabels[missing]}`); return; }

    try {
      setCreating(true);
      const { data: order } = await api.post("/api/orders/admin/manual", {
        customerInfo: {
          name: customer.name.trim(), email: customer.email.trim(),
          phone: customer.phone.trim(), country: customer.country.trim(),
          address: customer.address.trim(), city: customer.city.trim(),
          postalCode: customer.postalCode.trim(), state: customer.state.trim(),
        },
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, image: i.image })),
        shippingCost: shipping,
        paymentMethod: "card",
        ...(orderNotes.trim() ? { orderNotes: orderNotes.trim() } : {}),
      }, { headers: getAdminAuthHeaders() });

      if (!order?._id) throw new Error("No order ID");
      const { data: init } = await api.post(`/api/payments/epoint/init/${encodeURIComponent(String(order._id))}`);
      if (!init?.paymentUrl) throw new Error("No payment URL");
      setCreatedOrder(order);
      setPaymentLink(init.paymentUrl);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Не удалось создать заказ.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(paymentLink); setCopyState("ok"); }
    catch { setCopyState("err"); }
    setTimeout(() => setCopyState(""), 2200);
  };

  const handleWhatsApp = () => {
    const name = createdOrder?.customerInfo?.name || customer.name || "customer";
    const text = `Здравствуйте, ${name}! Вот ссылка для оплаты вашего заказа Sami:\n\n${paymentLink}\n\nСпасибо за покупку! 🌿`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const handleReset = () => {
    setCreatedOrder(null); setPaymentLink(""); setCopyState(""); setError("");
    setCustomer(EMPTY_CUSTOMER); setItems([]); setShippingCost("0");
    setOrderNotes(""); setProductSearch("");
  };

  /* ════════════════════════════════════════════════
     SUCCESS SCREEN
  ════════════════════════════════════════════════ */
  if (createdOrder && paymentLink) {
    return (
      <section className="mx-auto max-w-2xl space-y-6">
        {/* breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-black/40">
          <Link href="/admin/orders" className="hover:text-black/70">Заказы</Link>
          <ChevronRight size={11} />
          <span>Ручной заказ</span>
        </div>

        {/* green success banner */}
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check size={18} strokeWidth={3} className="text-white" />
          </div>
          <div>
            <p className="text-base font-semibold text-emerald-900">Заказ создан успешно</p>
            <p className="mt-0.5 text-sm text-emerald-700">
              #{String(createdOrder._id).slice(-8).toUpperCase()} · {createdOrder.customerInfo?.name}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-emerald-600 text-xs">Заказ:</span>
              <StatusBadge value={createdOrder.status || "pending"} />
              <span className="text-emerald-600 text-xs">Оплата:</span>
              <StatusBadge value={createdOrder.paymentStatus || "pending"} />
            </div>
          </div>
        </div>

        {/* payment link */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-black/80">Ссылка оплаты</p>
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-sand)]/40 px-3 py-2.5">
            <p className="flex-1 break-all font-mono text-[11px] text-black/60 leading-relaxed">
              {paymentLink}
            </p>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-black/30 transition-colors hover:text-black/70"
            >
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                copyState === "ok"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-[var(--color-line)] bg-white text-black/80 hover:bg-[var(--color-sand)]/60"
              }`}
            >
              {copyState === "ok"
                ? <><Check size={14} strokeWidth={2.5} /> Скопировано</>
                : <><Copy size={14} strokeWidth={1.8} /> Copy Payment Link</>
              }
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center gap-2 rounded-xl border border-[#25D366]/50 bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1ebe5d]"
            >
              <MessageCircle size={14} strokeWidth={2} />
              Send via WhatsApp
            </button>
          </div>

          <p className="mt-4 text-xs text-black/35">
            После оплаты статус обновится автоматически. Следить в{" "}
            <Link href="/admin/orders" className="underline underline-offset-2 hover:text-black/60">
              разделе Заказы
            </Link>.
          </p>
        </div>

        {/* order summary */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-black/80">Детали заказа</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[var(--color-sand)]/40 p-3.5 text-sm">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-black/35">Клиент</p>
              <p className="font-medium">{createdOrder.customerInfo?.name}</p>
              <p className="text-black/55">{createdOrder.customerInfo?.email}</p>
              <p className="text-black/55">{createdOrder.customerInfo?.phone}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-sand)]/40 p-3.5 text-sm">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-black/35">Сумма</p>
              <div className="space-y-0.5 text-black/60">
                <div className="flex justify-between"><span>Подытог</span><span>₼{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Доставка</span><span>₼{shipping.toFixed(2)}</span></div>
              </div>
              <div className="mt-2 flex justify-between border-t border-[var(--color-line)] pt-2 font-semibold text-black">
                <span>Итого</span><span>₼{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-sm text-black/40 underline underline-offset-2 hover:text-black/70"
        >
          <RotateCcw size={13} />
          Создать ещё один заказ
        </button>
      </section>
    );
  }

  /* ════════════════════════════════════════════════
     CREATION FORM
  ════════════════════════════════════════════════ */
  return (
    <section className="space-y-5">
      {/* header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-black/40">
          <Link href="/admin/orders" className="hover:text-black/70">Заказы</Link>
          <ChevronRight size={11} />
          <span>Ручной заказ</span>
        </div>
        <h1 className="sami-title mt-1">Ручное создание заказа</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Для клиентов из WhatsApp / Instagram — создайте заказ и отправьте ссылку оплаты.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">

        {/* ── LEFT: single unified customer form ── */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white shadow-sm">
          <div className="border-b border-[var(--color-line)] px-6 py-4">
            <p className="text-sm font-semibold text-black/80">Данные клиента и доставка</p>
          </div>
          <div className="px-6 py-5 space-y-4">

            {/* row 1 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>Имя и фамилия</Label>
                <Input placeholder="Lena Smirnova" value={customer.name} onChange={cf("name")} />
              </div>
              <div>
                <Label required>Email</Label>
                <Input type="email" placeholder="email@example.com" value={customer.email} onChange={cf("email")} />
              </div>
            </div>

            {/* row 2 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>Телефон / WhatsApp</Label>
                <Input type="tel" placeholder="+994 xx xxx xx xx" value={customer.phone} onChange={cf("phone")} />
              </div>
              <div>
                <Label required>Страна</Label>
                <Select value={customer.country} onChange={cf("country")}>
                  <option value="">Выберите страну</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            </div>

            <div className="border-t border-dashed border-[var(--color-line)] pt-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-black/35">Адрес доставки</p>

              {/* address full width */}
              <div className="mb-4">
                <Label required>Улица, дом, квартира</Label>
                <Input placeholder="ул. Низами 12, кв. 5" value={customer.address} onChange={cf("address")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <Label required>Город</Label>
                  <Input placeholder="Баку" value={customer.city} onChange={cf("city")} />
                </div>
                <div>
                  <Label required>Индекс</Label>
                  <Input placeholder="AZ1000" value={customer.postalCode} onChange={cf("postalCode")} />
                </div>
                <div>
                  <Label>Регион</Label>
                  <Input placeholder="опционально" value={customer.state} onChange={cf("state")} />
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-[var(--color-line)] pt-4">
              <Label>Заметки к заказу</Label>
              <textarea
                rows={3}
                className="sami-input resize-none"
                placeholder="Пожелания клиента, детали доставки…"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                maxLength={2000}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT: product picker + order summary ── */}
        <div className="space-y-5">

          {/* product picker */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-line)] px-5 py-4">
              <p className="text-sm font-semibold text-black/80">Товары</p>
            </div>
            <div className="p-4">
              {/* search */}
              <div className="relative mb-3">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35" />
                <input
                  className="sami-input pl-8 text-sm"
                  placeholder="Поиск по названию или коду…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              {/* product list */}
              <div className="max-h-[280px] overflow-y-auto rounded-xl border border-[var(--color-line)]">
                {productsLoading ? (
                  <p className="p-4 text-sm text-black/45">Загрузка каталога…</p>
                ) : filtered.length === 0 ? (
                  <p className="p-4 text-sm text-black/45">Ничего не найдено.</p>
                ) : (
                  filtered.slice(0, 60).map((p) => {
                    const inCart = items.some((i) => i.productId === p._id);
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className={`flex w-full items-center gap-3 border-b border-[var(--color-line)] px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-[var(--color-sand)]/50 ${
                          inCart ? "bg-[var(--color-sand)]/30" : ""
                        }`}
                      >
                        {p.images?.[0] ? (
                          <img
                            src={isCloudinaryUrl(p.images[0]) ? cloudinaryOptimizedUrl(p.images[0], { preset: "admin" }) : p.images[0]}
                            alt={p.name}
                            loading="lazy"
                            className="h-10 w-8 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-8 shrink-0 rounded-md bg-[var(--color-sand)]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-snug">{p.name}</p>
                          {p.code && <p className="font-mono text-[10px] text-black/35">{p.code}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">₼{unitPrice(p).toFixed(2)}</p>
                          {Number(p.discountPriceUSD) > 0 && Number(p.discountPriceUSD) < Number(p.priceUSD) && (
                            <p className="text-[10px] text-black/30 line-through">₼{Number(p.priceUSD).toFixed(2)}</p>
                          )}
                        </div>
                        <div className={`ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          inCart
                            ? "border-[var(--color-green)] bg-[var(--color-green)]/10 text-[var(--color-green)]"
                            : "border-[var(--color-line)] text-black/30 hover:border-[var(--color-green)] hover:text-[var(--color-green)]"
                        }`}>
                          <Plus size={12} strokeWidth={2.5} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* order summary / cart */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-line)] px-5 py-4">
              <p className="text-sm font-semibold text-black/80">Корзина и оплата</p>
            </div>
            <div className="p-4 space-y-3">

              {/* cart items */}
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--color-line)] px-4 py-7 text-center">
                  <ShoppingBag size={22} strokeWidth={1.2} className="mx-auto mb-2 text-black/20" />
                  <p className="text-sm text-black/35">Товары не добавлены</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-sand)]/20 px-3 py-2.5">
                      {item.image
                        ? <img
                            src={isCloudinaryUrl(item.image) ? cloudinaryOptimizedUrl(item.image, { preset: "admin" }) : item.image}
                            alt={item.name}
                            loading="lazy"
                            className="h-10 w-8 shrink-0 rounded-md object-cover"
                          />
                        : <div className="h-10 w-8 shrink-0 rounded-md bg-[var(--color-sand)]" />
                      }
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-snug">{item.name}</p>
                        <p className="text-xs text-black/40">₼{item.priceUSD.toFixed(2)} / шт</p>
                      </div>
                      {/* qty controls */}
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => changeQty(item.productId, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-line)] transition-colors hover:bg-[var(--color-sand)]">
                          <Minus size={11} strokeWidth={2.5} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" onClick={() => changeQty(item.productId, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-line)] transition-colors hover:bg-[var(--color-sand)]">
                          <Plus size={11} strokeWidth={2.5} />
                        </button>
                      </div>
                      <p className="w-14 shrink-0 text-right text-sm font-semibold">
                        ₼{(item.priceUSD * item.quantity).toFixed(2)}
                      </p>
                      <button type="button" onClick={() => removeItem(item.productId)}
                        className="text-black/20 transition-colors hover:text-red-500">
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* totals */}
              <div className="space-y-2 border-t border-[var(--color-line)] pt-3 text-sm">
                <div className="flex items-center justify-between text-black/60">
                  <span>Подытог</span>
                  <span className="font-medium text-black">₼{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-black/60">
                  <label htmlFor="ship" className="cursor-pointer">Доставка (₼)</label>
                  <input
                    id="ship"
                    type="number"
                    min="0"
                    step="0.5"
                    className="sami-input w-24 text-right text-sm"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-2.5 text-base font-bold">
                  <span>Итого</span>
                  <span>₼{total.toFixed(2)}</span>
                </div>
              </div>

              {/* error */}
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  <span className="mt-px text-red-400">⚠</span>
                  {error}
                </div>
              )}

              {/* CTA */}
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="sami-btn-dark flex w-full items-center justify-center gap-2 py-3.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Создание заказа…
                  </>
                ) : (
                  <>
                    <CreditCard size={15} strokeWidth={2}/>
                    Создать заказ и получить ссылку оплаты
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-black/30">
                Epoint · Банковская карта · Статус обновится автоматически
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
