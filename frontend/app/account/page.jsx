"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import api from "../../lib/api";
import { getCustomerAuthHeaders } from "../../lib/customerAuth";

const TABS = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, openAuthModal } = useAuth();
  const { convertPrice, currency } = useCurrency();

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
      router.replace("/");
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
    router.push("/");
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
            My Account
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-muted)]">
            Welcome back, {user.name}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="sami-btn-light inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[11px] tracking-[0.1em]"
        >
          <LogOut size={14} strokeWidth={1.8} />
          Sign Out
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
                      No orders yet
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                      Start shopping to see your orders here
                    </p>
                    <Link
                      href="/products"
                      className="sami-btn-dark mt-6 rounded-lg px-6 py-2.5 text-[11px] tracking-[0.1em]"
                    >
                      Browse Products
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
                            {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-medium">
                            {convertPrice(order.totalPriceUSD)} {currency}
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
                  <h2 className="text-[15px] font-medium">Saved Addresses</h2>
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        resetAddressForm();
                        setShowAddressForm(true);
                      }}
                      className="sami-btn-dark inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] tracking-[0.08em]"
                    >
                      <Plus size={14} strokeWidth={2} />
                      Add Address
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
                        {editingAddress ? "Edit Address" : "New Address"}
                      </h3>
                      <button type="button" onClick={resetAddressForm} className="rounded p-1 text-[var(--color-muted)] hover:text-black">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">Label</label>
                        <select
                          value={addressForm.label}
                          onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                          className="sami-input rounded-lg"
                        >
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">Full Name</label>
                        <input
                          required
                          value={addressForm.name}
                          onChange={(e) => setAddressForm((f) => ({ ...f, name: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">Phone</label>
                        <input
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">Country</label>
                        <input
                          required
                          value={addressForm.country}
                          onChange={(e) => setAddressForm((f) => ({ ...f, country: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder="Country"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">Address</label>
                        <input
                          required
                          value={addressForm.address}
                          onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder="Street address"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">City</label>
                        <input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">State / Province</label>
                        <input
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-black/45">Postal Code</label>
                        <input
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm((f) => ({ ...f, postalCode: e.target.value }))}
                          className="sami-input rounded-lg"
                          placeholder="Postal code"
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
                          Set as default
                        </label>
                      </div>
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button
                        type="submit"
                        className="sami-btn-dark rounded-lg px-6 py-2.5 text-[11px] tracking-[0.1em]"
                      >
                        {editingAddress ? "Update" : "Save"} Address
                      </button>
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="sami-btn-light rounded-lg px-6 py-2.5 text-[11px] tracking-[0.1em]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 && !showAddressForm ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-cream)]">
                      <MapPin size={24} strokeWidth={1.4} className="text-[var(--color-muted)]" />
                    </div>
                    <p className="mt-4 text-[14px] font-medium">No saved addresses</p>
                    <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                      Add an address for faster checkout
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
                            <Star size={10} fill="currentColor" /> Default
                          </span>
                        )}
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          {addr.label}
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
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={12} /> Remove
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
                    <p className="mt-4 text-[14px] font-medium">Your wishlist is empty</p>
                    <p className="mt-1 text-[12px] text-[var(--color-muted)]">
                      Save items you love for later
                    </p>
                    <Link
                      href="/products"
                      className="sami-btn-dark mt-6 rounded-lg px-6 py-2.5 text-[11px] tracking-[0.1em]"
                    >
                      Explore Collection
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
                              {convertPrice(product.priceUSD)} {currency}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveWishlist(product._id)}
                            className="mt-2 inline-flex w-fit items-center gap-1 rounded px-2 py-1 text-[11px] text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={12} /> Remove
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
