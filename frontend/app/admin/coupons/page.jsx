"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import StatusBadge from "../../../components/admin/StatusBadge";
import { t } from "../../../lib/admin-i18n";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: "", discountPercentage: "", expiresAt: "" });
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/api/coupons", { headers: getAdminAuthHeaders() });
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      setError(t.failedLoadCoupons);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      setError("");
      if (editingId) {
        await api.put(`/api/coupons/${editingId}`, form, { headers: getAdminAuthHeaders() });
      } else {
        await api.post("/api/coupons", form, { headers: getAdminAuthHeaders() });
      }
      setForm({ code: "", discountPercentage: "", expiresAt: "" });
      setEditingId("");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t.failedSaveCoupon);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/api/coupons/${id}`, { headers: getAdminAuthHeaders() });
      await load();
    } catch {
      setError(t.failedDeleteCoupon);
    }
  };

  return (
    <section className="space-y-4">
      <div className="sami-section p-6">
        <h1 className="sami-title">{t.coupons}</h1>
      </div>

      <div className="sami-section p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            className="sami-input"
            placeholder={t.couponCode}
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
          />
          <input
            className="sami-input"
            type="number"
            placeholder={t.discountPercent}
            value={form.discountPercentage}
            onChange={(event) => setForm((prev) => ({ ...prev, discountPercentage: event.target.value }))}
          />
          <input
            className="sami-input"
            type="date"
            value={form.expiresAt}
            onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={save} type="button" className="sami-btn-dark px-4 py-2">
            {editingId ? t.updateCoupon : t.createCoupon}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId("");
                setForm({ code: "", discountPercentage: "", expiresAt: "" });
              }}
              type="button"
              className="sami-btn-light px-4 py-2"
            >
              {t.cancel}
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="sami-section overflow-x-auto p-4">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)]">
              <th className="px-2 py-2">{t.code}</th>
              <th className="px-2 py-2">{t.discount}</th>
              <th className="px-2 py-2">{t.expires}</th>
              <th className="px-2 py-2">{t.status}</th>
              <th className="px-2 py-2">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => {
              const isExpired = new Date(coupon.expiresAt).getTime() < Date.now();
              return (
                <tr key={coupon._id} className="border-b border-[var(--color-line)]">
                  <td className="px-2 py-2 font-semibold">{coupon.code}</td>
                  <td className="px-2 py-2">{Number(coupon.discountPercentage || 0)}%</td>
                  <td className="px-2 py-2">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-2 py-2">
                    <StatusBadge value={!coupon.isActive || isExpired ? "cancelled" : "paid"} />
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        className="sami-btn-light px-3 py-1"
                        type="button"
                        onClick={() => {
                          setEditingId(coupon._id);
                          setForm({
                            code: coupon.code || "",
                            discountPercentage: String(coupon.discountPercentage || ""),
                            expiresAt: coupon.expiresAt
                              ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
                              : "",
                          });
                        }}
                      >
                        {t.edit}
                      </button>
                      <button className="sami-btn-dark px-3 py-1" type="button" onClick={() => remove(coupon._id)}>
                        {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="sami-section w-full max-w-lg p-5">
            <h2 className="text-lg font-semibold">{t.editCoupon}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input
                className="sami-input"
                placeholder={t.code}
                value={form.code}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              />
              <input
                className="sami-input"
                type="number"
                placeholder={t.discountPercent}
                value={form.discountPercentage}
                onChange={(event) => setForm((prev) => ({ ...prev, discountPercentage: event.target.value }))}
              />
              <input
                className="sami-input"
                type="date"
                value={form.expiresAt}
                onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={save} type="button" className="sami-btn-dark px-4 py-2">
                {t.save}
              </button>
              <button
                onClick={() => {
                  setEditingId("");
                  setForm({ code: "", discountPercentage: "", expiresAt: "" });
                }}
                type="button"
                className="sami-btn-light px-4 py-2"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
