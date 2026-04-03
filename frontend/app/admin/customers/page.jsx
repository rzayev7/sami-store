"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import { t } from "../../../lib/admin-i18n";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/api/admin/customers", {
          headers: getAdminAuthHeaders(),
        });
        setCustomers(Array.isArray(data) ? data : []);
      } catch {
        setError(t.failedLoadCustomers);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) =>
        String(customer.name || "").toLowerCase().includes(q) ||
        String(customer.email || "").toLowerCase().includes(q) ||
        String(customer.country || "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <section className="space-y-4">
      <div className="sami-section p-6">
        <h1 className="sami-title">{t.customers}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t.customerInsights}</p>
      </div>

      <div className="sami-section p-4">
        <input
          className="sami-input max-w-md"
          placeholder={t.searchCustomers}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="sami-section overflow-x-auto p-4">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)]">
              <th className="px-2 py-2">{t.customer}</th>
              <th className="px-2 py-2">{t.email}</th>
              <th className="px-2 py-2">{t.country}</th>
              <th className="px-2 py-2">{t.ordersCount}</th>
              <th className="px-2 py-2">{t.totalSpent}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.email} className="border-b border-[var(--color-line)]">
                <td className="px-2 py-2">{customer.name || "-"}</td>
                <td className="px-2 py-2">{customer.email || "-"}</td>
                <td className="px-2 py-2">{customer.country || "-"}</td>
                <td className="px-2 py-2">{Number(customer.orderCount || 0)}</td>
                <td className="px-2 py-2">₼{Number(customer.totalSpentUSD || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
