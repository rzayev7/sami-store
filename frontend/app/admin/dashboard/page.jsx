"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import api from "../../../lib/api";
import { t } from "../../../lib/admin-i18n";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import SalesLineChart from "../../../components/admin/SalesLineChart";
import StatusBadge from "../../../components/admin/StatusBadge";

function timeAgo(dateString) {
  if (!dateString) return "";
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return t.justNow;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}${t.mAgo}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${t.hAgo}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}${t.dAgo}`;
  return new Date(dateString).toLocaleDateString();
}

const statCards = [
  {
    key: "revenue",
    label: t.totalRevenue,
    icon: DollarSign,
    format: (v) => `₼${v.toFixed(2)}`,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "orders",
    label: t.totalOrders,
    icon: ShoppingCart,
    format: (v) => v.toLocaleString(),
    accent: "bg-blue-50 text-blue-600",
  },
  {
    key: "customers",
    label: t.totalCustomers,
    icon: Users,
    format: (v) => v.toLocaleString(),
    accent: "bg-violet-50 text-violet-600",
  },
  {
    key: "products",
    label: t.totalProducts,
    icon: Package,
    format: (v) => v.toLocaleString(),
    accent: "bg-amber-50 text-amber-600",
  },
];

function StatSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[var(--color-line)] bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-3 w-20 rounded bg-[var(--color-sand)]/70" />
          <div className="h-7 w-28 rounded bg-[var(--color-sand)]/70" />
        </div>
        <div className="h-10 w-10 rounded-xl bg-[var(--color-sand)]/50" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    recentOrders: [],
    salesLast30Days: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const { data } = await api.get("/api/admin/dashboard-stats", {
          headers: getAdminAuthHeaders(),
        });
        setStats({
          totalRevenue: Number(data?.totalRevenue || 0),
          totalOrders: Number(data?.totalOrders || 0),
          totalCustomers: Number(data?.totalCustomers || 0),
          totalProducts: Number(data?.totalProducts || 0),
          recentOrders: Array.isArray(data?.recentOrders)
            ? data.recentOrders
            : [],
          salesLast30Days: Array.isArray(data?.salesLast30Days)
            ? data.salesLast30Days
            : [],
        });
      } catch {
        setErrorMessage(t.failedLoadDashboard);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statValues = {
    revenue: stats.totalRevenue,
    orders: stats.totalOrders,
    customers: stats.totalCustomers,
    products: stats.totalProducts,
  };

  return (
    <section className="space-y-6">
      {/* Welcome + Quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-[0.01em] text-black/85 sm:text-2xl">
            {t.welcomeBack}
          </h1>
          <p className="mt-1 text-[13px] text-black/45">
            {t.dashboardSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/products/new"
            className="sami-btn-dark inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[12px] tracking-[0.1em]"
          >
            <Plus size={16} strokeWidth={2} />
            {t.addProduct}
          </Link>
          <Link
            href="/admin/orders"
            className="sami-btn-light inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[12px] tracking-[0.1em]"
          >
            {t.viewOrders}
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.key}
                  className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/45">
                        {card.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-black/85">
                        {card.format(statValues[card.key])}
                      </p>
                    </div>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}
                    >
                      <Icon size={20} strokeWidth={1.8} />
                    </div>
                  </div>
                </article>
              );
            })}
      </div>

      {/* Sales chart */}
      <div className="rounded-xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">
          {t.salesLast30Days}
        </p>
        <SalesLineChart points={stats.salesLast30Days} />
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-[13px] text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Recent orders */}
      <div className="rounded-xl border border-[var(--color-line)] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock size={16} strokeWidth={1.6} className="text-black/35" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45">
              {t.recentOrders}
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.06em] text-[var(--color-gold)] transition-colors hover:text-[var(--color-gold-soft)]"
          >
            {t.viewAll}
            <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-line)] bg-[var(--color-cream)]/40">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                  {t.order}
                </th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                  {t.customer}
                </th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                  {t.amount}
                </th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                  {t.status}
                </th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/40">
                  {t.time}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr
                    key={i}
                    className="animate-pulse border-b border-[var(--color-line)]"
                  >
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 w-20 rounded bg-[var(--color-sand)]/60" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : stats.recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-[13px] text-black/40"
                  >
                    {t.noOrdersYet}
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-[var(--color-line)] transition-colors hover:bg-[var(--color-cream)]/30"
                  >
                    <td className="px-5 py-3.5 font-mono text-[11px] text-black/50">
                      #{String(order._id).slice(-8)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-black/75">
                        {order.customerName || "-"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-black/35">
                        {order.email || ""}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-black/75">
                      ₼{Number(order.totalPriceUSD || 0).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge value={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-black/40">
                      {timeAgo(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
