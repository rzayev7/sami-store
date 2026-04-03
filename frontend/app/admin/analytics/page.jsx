"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import SalesLineChart from "../../../components/admin/SalesLineChart";
import { t } from "../../../lib/admin-i18n";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState({
    revenueByDay: {},
    ordersByDay: {},
    bestSellingProducts: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/admin/analytics", {
          headers: getAdminAuthHeaders(),
        });
        setAnalytics({
          revenueByDay: data?.revenueByDay || {},
          ordersByDay: data?.ordersByDay || {},
          bestSellingProducts: Array.isArray(data?.bestSellingProducts) ? data.bestSellingProducts : [],
        });
      } catch {
        setError(t.failedLoadAnalytics);
      }
    };
    load();
  }, []);

  const chartPoints = useMemo(() => {
    const keys = new Set([
      ...Object.keys(analytics.revenueByDay || {}),
      ...Object.keys(analytics.ordersByDay || {}),
    ]);

    return Array.from(keys)
      .sort()
      .slice(-30)
      .map((date) => ({
        date,
        revenue: Number(analytics.revenueByDay[date] || 0),
        orders: Number(analytics.ordersByDay[date] || 0),
      }));
  }, [analytics.revenueByDay, analytics.ordersByDay]);

  return (
    <section className="space-y-4">
      <div className="sami-section p-6">
        <h1 className="sami-title">{t.analytics}</h1>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="sami-section p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-black/60">{t.revenueTrend}</p>
        <div className="mt-4">
          <SalesLineChart points={chartPoints} />
        </div>
      </div>

      <div className="sami-section overflow-x-auto p-5">
        <p className="mb-4 text-xs uppercase tracking-[0.14em] text-black/60">{t.bestSellingProducts}</p>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)]">
              <th className="px-2 py-2">{t.product}</th>
              <th className="px-2 py-2">{t.soldUnits}</th>
            </tr>
          </thead>
          <tbody>
            {analytics.bestSellingProducts.map((product) => (
              <tr key={product.productId} className="border-b border-[var(--color-line)]">
                <td className="px-2 py-2">{product.name}</td>
                <td className="px-2 py-2">{Number(product.soldUnits || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
