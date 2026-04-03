"use client";

import { t } from "../../lib/admin-i18n";

const STATUS_CONFIG = {
  pending: { label: t.statusPending, dot: "bg-neutral-400", text: "text-neutral-500" },
  paid: { label: t.statusPaid, dot: "bg-emerald-500", text: "text-emerald-600" },
  shipped: { label: t.statusShipped, dot: "bg-blue-500", text: "text-blue-600" },
  delivered: { label: t.statusDelivered, dot: "bg-green-600", text: "text-green-600" },
  cancelled: { label: t.statusCancelled, dot: "bg-red-400", text: "text-red-500" },
  failed: { label: t.statusFailed, dot: "bg-red-400", text: "text-red-500" },
  refunded: { label: t.statusRefunded, dot: "bg-purple-400", text: "text-purple-500" },
};

const FALLBACK = { dot: "bg-neutral-400", text: "text-neutral-500" };

export default function StatusBadge({ value }) {
  const normalized = String(value || "pending").toLowerCase();
  const cfg = STATUS_CONFIG[normalized] || FALLBACK;
  const label = cfg.label || normalized;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
      <span className={`${cfg.dot} inline-block h-1.5 w-1.5 rounded-full`} />
      {label}
    </span>
  );
}
