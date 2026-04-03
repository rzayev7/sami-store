"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import { t } from "../../../lib/admin-i18n";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const { data } = await api.get("/api/products", {
          headers: getAdminAuthHeaders(),
          params: { _t: Date.now() },
        });
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setErrorMessage(t.failedLoadProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    try {
      setDeletingId(productId);
      await api.delete(`/api/products/${productId}`, {
        headers: getAdminAuthHeaders(),
      });
      setProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch {
      setErrorMessage(t.failedDeleteProduct);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="space-y-5">
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="sami-title">{t.products}</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{t.manageInventory}</p>
          </div>
          <Link
            href="/admin/products/new"
            className="sami-btn-dark px-4 py-2"
          >
            {t.addProduct}
          </Link>
        </div>
        <div className="mb-4">
          <input
            type="search"
            placeholder={t.searchProducts}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sami-input max-w-md"
          />
        </div>

        <div className="sami-section overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-[var(--color-sand)] text-black">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.image}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.code}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.name}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.category}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.price}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.stock}
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em]">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-black/70">
                    {t.loadingProducts}
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-red-600">
                    {errorMessage}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-black/70">
                    {t.noProductsFound}
                  </td>
                </tr>
              ) : (
                products
                  .filter((product) => {
                    const q = search.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      String(product.name || "").toLowerCase().includes(q) ||
                      String(product.category || "").toLowerCase().includes(q) ||
                      String(product.code || "").toLowerCase().includes(q)
                    );
                  })
                  .map((product) => (
                  <tr key={product._id} className="border-t border-[var(--color-line)]">
                    <td className="px-4 py-3">
                      <div className="h-14 w-12 overflow-hidden rounded-md bg-[var(--color-sand)]">
                        <img
                          src={product.images?.[0] || "https://placehold.co/120x160?text=Sami"}
                          alt={product.name || "Product image"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-black/70">{product.code || "-"}</td>
                    <td className="px-4 py-3">{product.name || "-"}</td>
                    <td className="px-4 py-3">{product.category || "-"}</td>
                    <td className="px-4 py-3">₼{Number(product.priceUSD || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {Number(product.stock || 0) <= 3 ? (
                        <span className="font-medium text-red-600">{t.lowStock} ({Number(product.stock || 0)})</span>
                      ) : Number(product.stock || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/edit/${product._id}`}
                          className="sami-btn-light px-3 py-1"
                        >
                          {t.edit}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(product._id)}
                          disabled={deletingId === product._id}
                          className="sami-btn-dark px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === product._id ? t.deleting : t.delete}
                        </button>
                      </div>
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
