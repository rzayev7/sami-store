"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import { t } from "../../../lib/admin-i18n";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/api/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setError(t.failedLoadCategories);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveCategory = async () => {
    try {
      setError("");
      if (!name.trim()) return;
      if (editing) {
        await api.put(
          `/api/categories/${editing._id}`,
          { name: name.trim() },
          { headers: getAdminAuthHeaders() }
        );
      } else {
        await api.post("/api/categories", { name: name.trim() }, { headers: getAdminAuthHeaders() });
      }
      setName("");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t.failedSaveCategory);
    }
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/api/categories/${id}`, { headers: getAdminAuthHeaders() });
      await load();
    } catch {
      setError(t.failedDeleteCategory);
    }
  };

  return (
    <section className="space-y-4">
      <div className="sami-section p-6">
        <h1 className="sami-title">{t.categories}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t.manageCategories}</p>
      </div>

      <div className="sami-section p-5">
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="sami-input max-w-md"
            placeholder={t.categoryName}
          />
          <button type="button" onClick={saveCategory} className="sami-btn-dark px-4 py-2">
            {t.addCategory}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="sami-section overflow-x-auto p-4">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)]">
              <th className="px-2 py-2">{t.name}</th>
              <th className="px-2 py-2">{t.slug}</th>
              <th className="px-2 py-2">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category._id} className="border-b border-[var(--color-line)]">
                <td className="px-2 py-2">{category.name}</td>
                <td className="px-2 py-2 text-black/60">{category.slug}</td>
                <td className="px-2 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(category);
                        setName(category.name || "");
                      }}
                      className="sami-btn-light px-3 py-1"
                    >
                      {t.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category._id)}
                      className="sami-btn-dark px-3 py-1"
                    >
                      {t.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-2 py-4 text-black/60">
                  {t.noCategoriesYet}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="sami-section w-full max-w-md p-5">
            <h2 className="text-lg font-semibold">{t.editCategory}</h2>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="sami-input mt-3"
              placeholder={t.categoryName}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={saveCategory} className="sami-btn-dark px-4 py-2">
                {t.save}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setName("");
                }}
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
