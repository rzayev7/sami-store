"use client";

import { t } from "../../lib/admin-i18n";

export default function SalesLineChart({ points = [] }) {
  if (!points.length) {
    return <div className="rounded-lg border border-dashed border-[var(--color-line)] p-6 text-sm text-black/60">{t.noSalesDataYet}</div>;
  }

  const revenueValues = points.map((p) => Number(p.revenue || 0));
  const orderValues = points.map((p) => Number(p.orders || 0));
  const hasRevenueData = revenueValues.some((value) => value > 0);
  const hasOrderData = orderValues.some((value) => value > 0);
  if (!hasRevenueData && !hasOrderData) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] p-6 text-sm text-black/60">
        {t.noSalesLast30}
      </div>
    );
  }

  const width = 760;
  const height = 240;
  const padding = 28;
  const maxRevenue = Math.max(...revenueValues, 1);
  const maxOrders = Math.max(...orderValues, 1);
  const minX = 0;
  const maxX = points.length - 1 || 1;

  const toX = (index) => padding + ((width - padding * 2) * (index - minX)) / (maxX - minX || 1);
  const toRevenueY = (value) =>
    height - padding - ((height - padding * 2) * value) / maxRevenue;
  const toOrdersY = (value) =>
    height - padding - ((height - padding * 2) * value) / maxOrders;

  const revenuePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${toX(index)} ${toRevenueY(Number(point.revenue || 0))}`
    )
    .join(" ");

  const ordersPath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${toX(index)} ${toOrdersY(Number(point.orders || 0))}`
    )
    .join(" ");

  const xTicks = [0, Math.floor((points.length - 1) / 2), points.length - 1]
    .filter((idx, i, arr) => arr.indexOf(idx) === i)
    .map((idx) => ({
      idx,
      x: toX(idx),
      label: String(points[idx]?.date || "").slice(5),
    }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#123b2d]" />
          {t.revenue}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-[#8b5e34]" />
          {t.orders}
        </span>
      </div>
      <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[240px] min-w-[640px] w-full">
        {[0.25, 0.5, 0.75].map((tick) => (
          <line
            key={tick}
            x1={padding}
            y1={padding + (height - padding * 2) * tick}
            x2={width - padding}
            y2={padding + (height - padding * 2) * tick}
            stroke="#ece6db"
          />
        ))}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d8d0c2" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d8d0c2" />
        {hasRevenueData && (
          <path d={revenuePath} fill="none" stroke="#123b2d" strokeWidth="3" strokeLinecap="round" />
        )}
        {hasOrderData && (
          <path d={ordersPath} fill="none" stroke="#8b5e34" strokeWidth="2.5" strokeLinecap="round" />
        )}
        {points.map((point, index) => {
          const revenueValue = Number(point.revenue || 0);
          const ordersValue = Number(point.orders || 0);
          return (
            <g key={`${point.date}-${index}`}>
              {hasRevenueData && (
                <circle cx={toX(index)} cy={toRevenueY(revenueValue)} r="2.5" fill="#123b2d" />
              )}
              {hasOrderData && (
                <circle cx={toX(index)} cy={toOrdersY(ordersValue)} r="2.2" fill="#8b5e34" />
              )}
            </g>
          );
        })}
        {xTicks.map((tick) => (
          <text
            key={`tick-${tick.idx}`}
            x={tick.x}
            y={height - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#7b7268"
          >
            {tick.label}
          </text>
        ))}
      </svg>
    </div>
    </div>
  );
}
