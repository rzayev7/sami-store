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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../lib/api";
import { getCustomerAuthHeaders } from "../../lib/customerAuth";
import { useLocalePath } from "../../context/LanguageContext";

export default function AccountPage() {
  const router = useRouter();
  const localePath = useLocalePath();
  const { user, loading: authLoading, logout, openAuthModal } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const { t } = useLanguage();

  const TABS = [
    { id: "orders", label: t("account.orders"), icon: Package },
    { id: "addresses", label: t("account.addresses"), icon: MapPin },
    { id: "wishlist", label: t("account.wishlist"), icon: Heart },
  ];

  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
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
                      <div key={order._id} className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[13px] font-medium">
                              #{order._id.slice(-8).toUpperCase()}
                            </p>
                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusColor(order.status)}`}>
                              {order.status}
                            </span>
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
                        <ChevronRight size={16} className="shrink-0 text-[var(--color-muted)]" />
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
                  <div className="grid grid-cols-1 divide-y divide-[var(--color-line)] sm:grid-cols-2 sm:divide-y-0 sm:gap-px sm:bg-[var(--color-line)]">
                    {wishlist.map((product) => (
                      <div key={product._id} className="flex gap-4 bg-white p-5 sm:p-6">
                        <Link href={`/products/${product._id}`} className="shrink-0">
                          <div className="h-24 w-20 overflow-hidden rounded-lg bg-[var(--color-cream)]">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <Link href={`/products/${product._id}`}>
                              <p className="truncate text-[13px] font-medium hover:text-[var(--color-gold)]">
                                {product.name}
                              </p>
                            </Link>
                            <p className="mt-0.5 text-[13px] font-medium text-[var(--color-gold)]">
                              {formatPrice(product.priceUSD)} {currency}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveWishlist(product._id)}
                            className="mt-2 inline-flex w-fit items-center gap-1 rounded px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-50 hover:text-red-600"
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
          </>
        )}
      </div>
    </div>
  );
}
