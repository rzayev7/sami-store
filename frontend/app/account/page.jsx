"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "../../components/LocaleLink";
import {
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  Star,
  ShoppingBag,
  X,
  Edit3,
  Gift,
  RotateCcw,
  FileText,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import api from "../../lib/api";
import { getCustomerAuthHeaders } from "../../lib/customerAuth";
import { useLocalePath } from "../../context/LanguageContext";
import { cloudinaryOptimizedUrl, isCloudinaryUrl } from "../../lib/image";

export default function AccountPage() {
  const router = useRouter();
  const localePath = useLocalePath();
  const { user, loading: authLoading, logout, openAuthModal } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const { t } = useLanguage();
  const { addToCart } = useCart();

  const TABS = [
    { id: "orders", label: t("account.orders"), icon: Package },
    { id: "addresses", label: t("account.addresses"), icon: MapPin },
    { id: "wishlist", label: t("account.wishlist"), icon: Heart },
    { id: "points", label: "Points", icon: Gift },
  ];

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [pointsData, setPointsData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    name: "",
    phone: "",
    country: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal();
      router.replace(localePath("/"));
    }
  }, [user, authLoading, router, openAuthModal]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    const headers = getCustomerAuthHeaders();

    try {
      if (activeTab === "orders") {
        const { data } = await api.get("/api/customers/orders", { headers });
        setOrders(data);
      } else if (activeTab === "addresses") {
        const { data } = await api.get("/api/customers/addresses", { headers });
        setAddresses(data);
      } else if (activeTab === "wishlist") {
        const { data } = await api.get("/api/customers/wishlist", { headers });
        setWishlist(data);
      } else if (activeTab === "points") {
        const { data } = await api.get("/api/customers/points", { headers });
        setPointsData(data);
      }
    } catch {
      /* silently fail */
    } finally {
      setDataLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    router.push(localePath("/"));
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: "Home",
      name: "",
      phone: "",
      country: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      isDefault: false,
    });
    setEditingAddress(null);
    setShowAddressForm(false);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const headers = getCustomerAuthHeaders();

    try {
      if (editingAddress) {
        const { data } = await api.put(
          `/api/customers/addresses/${editingAddress}`,
          addressForm,
          { headers }
        );
        setAddresses(data);
      } else {
        const { data } = await api.post("/api/customers/addresses", addressForm, {
          headers,
        });
        setAddresses(data);
      }
      resetAddressForm();
    } catch {
      /* silently fail */
    }
  };

  const handleEditAddress = (addr) => {
    setAddressForm({
      label: addr.label || "Home",
      name: addr.name,
      phone: addr.phone || "",
      country: addr.country,
      address: addr.address,
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      isDefault: addr.isDefault || false,
    });
    setEditingAddress(addr._id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    const headers = getCustomerAuthHeaders();
    try {
      const { data } = await api.delete(`/api/customers/addresses/${id}`, {
        headers,
      });
      setAddresses(data);
    } catch {
      /* silently fail */
    }
  };

  const handleReorder = (order) => {
    if (!Array.isArray(order.items)) return;
    order.items.forEach((item) => {
      addToCart(
        {
          _id: item.productId,
          name: item.name,
          priceUSD: item.priceUSD,
          images: item.image ? [item.image] : [],
          sizes: item.size ? [item.size] : [],
        },
        item.size || "",
        item.quantity || 1
      );
    });
  };

  const handleRemoveWishlist = async (productId) => {
    const headers = getCustomerAuthHeaders();
    try {
      const { data } = await api.post(
        "/api/customers/wishlist",
        { productId },
        { headers }
      );
      setWishlist(data);
    } catch {
      /* silently fail */
    }
  };

  const statusColor = (status) => {
    const map = {
      pending: "bg-amber-50 text-amber-700",
      paid: "bg-blue-50 text-blue-700",
      shipped: "bg-indigo-50 text-indigo-700",
      delivered: "bg-emerald-50 text-emerald-700",
      cancelled: "bg-red-50 text-red-700",
    };
    return map[status] || "bg-gray-50 text-gray-700";
  };

  const addressLabelDisplay = (label) => {
    const map = { Home: t("account.home"), Work: t("account.work"), Other: t("account.other") };
    return map[label] || label;
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--color-gold)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-4">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[24px] font-medium tracking-[0.02em]">
            {t("account.myAccount")}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            {t("account.welcomeBack", { name: user.name })}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="sami-btn-light inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] tracking-[0.1em]"
        >
          <LogOut size={14} strokeWidth={1.8} />
          {t("auth.signOut")}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm border border-[var(--color-line)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-[12px] font-medium tracking-[0.06em] uppercase transition-all ${
                isActive
                  ? "bg-[var(--color-green)] text-[var(--color-gold-soft)] shadow-sm"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-cream)] hover:text-[var(--color-black)]"
              }`}
            >
              <Icon size={15} strokeWidth={1.8} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="sami-section min-h-[400px] overflow-hidden">
        {dataLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[var(--color-gold)]" />
          </div>
        ) : (
          <>
            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <div>
                {orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-cream)]">
                      <ShoppingBag size={24} strokeWidth={1.4} className="text-[var(--color-muted)]" />
                    </div>
                    <p className="mt-4 text-[14px] font-medium text-[var(--color-black)]">
                      {t("account.noOrders")}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                      {t("account.noOrdersHint")}
                    </p>
                    <Link
                      href="/products"
                      className="sami-btn-dark mt-6 rounded-lg px-6 py-2.5 text-[11px] tracking-[0.1em]"
                    >
                      {t("account.browseProducts")}
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-line)]">
                    {orders.map((order) => (
                      <div key={order._id} className="px-6 py-5 sm:px-8">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-medium">
                                #{order._id.slice(-8).toUpperCase()}
                              </p>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusColor(order.status)}`}>
                                {order.status}
                              </span>
                              {order.pointsEarned > 0 && (
                                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                  <Sparkles size={9} /> +{order.pointsEarned} pts
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                              {new Date(order.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                              {" · "}
                              {order.items?.length || 0} {order.items?.length !== 1 ? t("common.items") : t("common.item")}
                            </p>
                          </div>
                          <div className="text-end">
                            <p className="text-[14px] font-medium">
                              {formatPrice(order.totalPriceUSD)} {currency}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] text-black/70 transition hover:bg-[var(--color-cream)] hover:text-black"
                          >
                            <RotateCcw size={11} strokeWidth={2} />
                            Reorder
                          </button>
                          <Link
                            href={`/orders/${order._id}/invoice`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] text-black/70 transition hover:bg-[var(--color-cream)] hover:text-black"
                          >
                            <FileText size={11} strokeWidth={2} />
                            Invoice
                          </Link>
                          <Link
                            href={`/track-order?id=${order._id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] text-black/70 transition hover:bg-[var(--color-cream)] hover:text-black"
                          >
                            <ChevronRight size={11} strokeWidth={2} />
                            Track
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-[15px] font-medium">{t("account.savedAddresses")}</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        resetAddressForm();
                        setShowAddressForm(true);
                      }}
                      className="sami-btn-dark inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] tracking-[0.08em]"
                    >
                      <Plus size={14} strokeWidth={2} />
                      {t("account.addAddress")}
                    </button>
                  )}
                </div>

                {showAddressForm && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="mb-8 rounded-xl border border-[var(--color-line)] bg-[var(--color-cream)] p-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-[13px] font-medium">
                        {editingAddress ? t("account.editAddress") : t("account.newAddress")}
                      </h3>
                      <button type="button" onClick={resetAddressForm} className="rounded p-1 text-[var(--color-muted)] hover:text-black">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">{t("account.labelField")}</label>
                        <select
                          value={addressForm.label}
                          onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                          className="sami-input rounded-lg"
                        >
                          <option value="Home">{t("account.home")}</option>
                          <option value="Work">{t("account.work")}</option>
                          <option value="Other">{t("account.other")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">{t("account.fullName")}</label>
                        <input
                          required
                          value={addressForm.name}
                          onChange={(e) => setAddressForm((f) => ({ ...f, name: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder={t("account.fullNamePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">{t("account.phone")}</label>
                        <input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder={t("account.phonePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">{t("account.country")}</label>
                        <input
                          required
                          value={addressForm.country}
                          onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder={t("account.countryPlaceholder")}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">{t("account.address")}</label>
                        <input
                          required
                          value={addressForm.address}
                          onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder={t("account.streetAddressPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">{t("account.city")}</label>
                        <input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder={t("account.cityPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">{t("account.stateProvince")}</label>
                        <input
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder={t("account.statePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">{t("account.postalCode")}</label>
                        <input
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm((f) => ({ ...f, postalCode: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder={t("account.postalCodePlaceholder")}
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-[12px]">
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))}
                            className="h-4 w-4 accent-[var(--color-green)]"
                          />
                          {t("account.setAsDefault")}
                        </label>
                      </div>
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button
                        type="submit"
                        className="sami-btn-dark rounded-lg px-6 py-2.5 text-[11px] tracking-[0.1em]"
                      >
                        {editingAddress ? t("account.updateAddress") : t("account.saveAddress")}
                      </button>
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="sami-btn-light rounded-lg px-6 py-2.5 text-[11px] tracking-[0.1em]"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 && !showAddressForm ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-cream)]">
                      <MapPin size={24} strokeWidth={1.4} className="text-[var(--color-muted)]" />
                    </div>
                    <p className="mt-4 text-[14px] font-medium">{t("account.noAddresses")}</p>
                    <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                      {t("account.noAddressesHint")}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id}
                        className={`relative rounded-xl border p-5 ${
                          addr.isDefault
                            ? "border-[var(--color-gold)] bg-[var(--color-cream)]"
                            : "border-[var(--color-line)]"
                        }`}
                      >
                        {addr.isDefault && (
                          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-gold)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-gold)]">
                            <Star size={10} fill="currentColor" /> {t("account.default")}
                          </span>
                        )}
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          {addressLabelDisplay(addr.label)}
                        </p>
                        <p className="mt-1 text-[13px] font-medium">{addr.name}</p>
                        <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                          {addr.address}
                          {addr.city && `, ${addr.city}`}
                          {addr.state && `, ${addr.state}`}
                          {addr.postalCode && ` ${addr.postalCode}`}
                        </p>
                        <p className="text-[12px] text-[var(--color-muted)]">{addr.country}</p>
                        {addr.phone && (
                          <p className="mt-1 text-[12px] text-[var(--color-muted)]">{addr.phone}</p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleEditAddress(addr)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-[var(--color-muted)] transition hover:bg-black/5 hover:text-black"
                          >
                            <Edit3 size={12} /> {t("common.edit")}
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={12} /> {t("common.remove")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div>
                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-cream)]">
                      <Heart size={24} strokeWidth={1.4} className="text-[var(--color-muted)]" />
                    </div>
                    <p className="mt-4 text-[14px] font-medium">{t("account.emptyWishlist")}</p>
                    <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                      {t("account.emptyWishlistHint")}
                    </p>
                    <Link
                      href="/products"
                      className="sami-btn-dark mt-6 rounded-lg px-6 py-2.5 text-[11px] tracking-[0.1em]"
                    >
                      {t("account.exploreCollection")}
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-px bg-[var(--color-line)] sm:grid-cols-3 lg:grid-cols-4">
                    {wishlist.map((product) => {
                      const hasDiscount =
                        product.discountPriceUSD != null &&
                        Number(product.discountPriceUSD) > 0 &&
                        Number(product.discountPriceUSD) < Number(product.priceUSD);
                      const preferredSize = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes[0] : "";
                      return (
                        <div key={product._id} className="group relative flex flex-col bg-white">
                          <Link href={`/products/${product._id}`} className="block">
                            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-cream)]">
                              {product.images?.[0] && (
                                <img
                                  src={
                                    isCloudinaryUrl(product.images[0])
                                      ? cloudinaryOptimizedUrl(product.images[0], { preset: "listing" })
                                      : product.images[0]
                                  }
                                  alt={product.name}
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                              )}
                              {hasDiscount && (
                                <span className="absolute start-2 top-2 rounded bg-black px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
                                  Sale
                                </span>
                              )}
                            </div>
                          </Link>

                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveWishlist(product._id)}
                            aria-label="Remove from wishlist"
                            className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-black/40 opacity-0 shadow-sm backdrop-blur-[2px] transition hover:text-red-500 group-hover:opacity-100"
                          >
                            <X size={13} strokeWidth={2} />
                          </button>

                          <div className="flex flex-1 flex-col gap-2 p-3">
                            <Link href={`/products/${product._id}`}>
                              <p className="line-clamp-2 text-[12px] font-medium leading-5 hover:text-[var(--color-gold)]">
                                {product.name}
                              </p>
                            </Link>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-medium">
                                {formatPrice(hasDiscount ? product.discountPriceUSD : product.priceUSD)} {currency}
                              </span>
                              {hasDiscount && (
                                <span className="text-[11px] text-black/30 line-through">
                                  {formatPrice(product.priceUSD)}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => addToCart(product, preferredSize)}
                              className="mt-auto w-full border border-[#1e1b17] py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1e1b17] transition hover:bg-[#1e1b17] hover:text-[#f2e7d1]"
                            >
                              {t("product.addToBag")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {/* POINTS TAB */}
            {activeTab === "points" && (
              <div className="p-6 sm:p-8">
                {/* Balance card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2118] to-[#1a150e] p-6 text-white sm:p-8">
                  <div className="absolute -end-6 -top-6 h-32 w-32 rounded-full bg-[var(--color-gold)]/10" />
                  <div className="absolute -bottom-8 -start-4 h-24 w-24 rounded-full bg-[var(--color-gold)]/5" />
                  <p className="relative text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
                    Your Balance
                  </p>
                  <div className="relative mt-2 flex items-end gap-3">
                    <span className="text-5xl font-semibold tracking-tight text-[var(--color-gold)]">
                      {pointsData?.balance ?? 0}
                    </span>
                    <span className="mb-1.5 text-[14px] text-white/60">points</span>
                  </div>
                  <div className="relative mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-[12px]">
                    <div>
                      <p className="text-white/40">Earn rate</p>
                      <p className="mt-0.5 font-medium text-white">$1 spent = 1 point</p>
                    </div>
                    <div>
                      <p className="text-white/40">Redeem rate</p>
                      <p className="mt-0.5 font-medium text-white">
                        {pointsData?.pointsPerDollar ?? 20} points = $1 off
                      </p>
                    </div>
                  </div>
                  <p className="relative mt-3 text-[11px] text-white/30">
                    Min. {pointsData?.minRedeem ?? 100} points to redeem · redeem at checkout
                  </p>
                </div>

                {/* How it works */}
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: ShoppingBag, title: "Shop & Earn", desc: "Earn 1 point for every $1 spent on any order." },
                    { icon: Sparkles, title: "Collect Points", desc: "Points are added automatically after payment." },
                    { icon: Gift, title: "Redeem at Checkout", desc: "Use points for a discount on your next order." },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="rounded-xl border border-[var(--color-line)] p-4">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                        <Icon size={15} className="text-amber-600" strokeWidth={1.8} />
                      </div>
                      <p className="text-[12px] font-semibold">{title}</p>
                      <p className="mt-1 text-[11px] leading-[1.6] text-[var(--color-muted)]">{desc}</p>
                    </div>
                  ))}
                </div>

                {/* Points history */}
                {pointsData?.history?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-black/50">
                      Points History
                    </h3>
                    <div className="divide-y divide-[var(--color-line)] rounded-xl border border-[var(--color-line)]">
                      {pointsData.history.map((h) => (
                        <div key={h._id} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-[12px] font-medium">
                              Order #{String(h._id).slice(-8).toUpperCase()}
                            </p>
                            <p className="text-[11px] text-[var(--color-muted)]">
                              {new Date(h.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <span className="text-[13px] font-semibold text-emerald-600">
                            +{h.pointsEarned} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pointsData?.history?.length === 0 && (
                  <p className="mt-6 text-center text-[13px] text-[var(--color-muted)]">
                    Place your first order to start earning points.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
