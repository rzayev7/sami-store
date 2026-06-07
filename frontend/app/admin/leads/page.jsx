"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../../../lib/api";
import { getAdminAuthHeaders } from "../../../lib/adminAuth";
import { t } from "../../../lib/admin-i18n";

const PAGE_SIZE = 50;

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/api/leads?page=${pg}&limit=${PAGE_SIZE}`, {
        headers: getAdminAuthHeaders(),
      });
      setLeads(Array.isArray(data.leads) ? data.leads : []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? pg);
      setPages(data.pages ?? 1);
    } catch {
      setError(t.failedLoadLeads);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleExport = () => {
    const token = getAdminAuthHeaders()?.Authorization?.replace("Bearer ", "") ?? "";
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
    window.open(`${base}/api/leads/export.csv?token=${encodeURIComponent(token)}`, "_blank");
  };

  return (
    <section className="space-y-4">
      <div className="sami-section p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="sami-title">{t.leads}</h1>
            <p className="mt-1 text-[12px] text-black/50">{t.leadsSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {total > 0 && (
              <span className="rounded-full bg-[var(--color-sand)] px-3 py-1 text-[11px] font-medium tracking-[0.06em] text-black/60">
                {typeof t.leadsTotal === "function" ? t.leadsTotal(total) : total}
              </span>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="sami-btn-dark rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em]"
            >
              {t.exportCsv}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="sami-section overflow-x-auto p-0">
        {loading ? (
          <p className="p-6 text-sm text-black/50">{t.loadingProducts}</p>
        ) : leads.length === 0 ? (
          <p className="p-6 text-sm text-black/50">{t.noLeadsYet}</p>
        ) : (
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-[10px] uppercase tracking-[0.12em] text-black/40">
                <th className="px-4 py-3">{t.email}</th>
                <th className="px-4 py-3">{t.whatsapp}</th>
                <th className="px-4 py-3">{t.source}</th>
                <th className="px-4 py-3">{t.leadLanguage}</th>
                <th className="px-4 py-3">{t.country}</th>
                <th className="px-4 py-3">{t.leadPage}</th>
                <th className="px-4 py-3">{t.leadDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-line)]">
              {leads.map((lead) => (
                <tr key={lead._id} className="text-[12.5px] text-black/75 hover:bg-black/[0.015]">
                  <td className="px-4 py-2.5 font-mono text-[11.5px]">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-[var(--color-gold)] underline underline-offset-2"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-black/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11.5px]">
                    {lead.whatsapp ? (
                      <a
                        href={`https://wa.me/${lead.whatsappNormalized || lead.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 underline underline-offset-2"
                        title={lead.whatsapp}
                      >
                        {lead.whatsapp}
                      </a>
                    ) : (
                      <span className="text-black/25">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-black/40">{lead.source || "—"}</td>
                  <td className="px-4 py-2.5 uppercase">{lead.language || "—"}</td>
                  <td className="px-4 py-2.5 text-black/55">{lead.country || "—"}</td>
                  <td className="px-4 py-2.5 max-w-[180px] truncate text-black/40">{lead.page || "—"}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-black/40">{formatDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[11px] disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-[11px] text-black/50">
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[11px] disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}
