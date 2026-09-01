"use client";

import { useState } from "react";

type MonthRow = { month: string; revenue: number; costs: number; profit: number };

const width = 720;
const height = 260;
const padding = { top: 16, right: 16, bottom: 44, left: 56 };
const revenueColor = "#2563eb";
const costsColor = "#e34948";

function niceMax(value: number) {
  if (value <= 0) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

function labelMonth(month: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
}

/** Grouped revenue/expense bars per month, one shared money axis, with profit direct-labeled above each pair. */
export default function ProfitLossChart({
  rows,
  formatValue,
}: {
  rows: MonthRow[];
  formatValue: (value: number) => string;
}) {
  const [hoverMonth, setHoverMonth] = useState<string | null>(null);
  const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month));

  if (!sorted.length) {
    return <div className="grid h-56 place-items-center rounded-xl bg-slate-50 text-sm text-slate-500">No data for this period.</div>;
  }

  const max = niceMax(Math.max(...sorted.map((row) => Math.max(row.revenue, row.costs))));
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const groupWidth = innerWidth / sorted.length;
  const barWidth = Math.min(24, groupWidth * 0.32);
  const yFor = (value: number) => padding.top + innerHeight - (value / max) * innerHeight;
  const yTicks = [0, max / 2, max];

  return (
    <div>
      <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: revenueColor }} />Revenue</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: costsColor }} />Expenses</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full" role="img" aria-label="Monthly revenue and expenses">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padding.left - 8} y={yFor(tick)} textAnchor="end" dominantBaseline="middle" className="fill-slate-400" fontSize={10}>{formatValue(tick)}</text>
          </g>
        ))}
        {sorted.map((row, index) => {
          const groupX = padding.left + index * groupWidth;
          const center = groupX + groupWidth / 2;
          const hovered = hoverMonth === row.month;
          return (
            <g key={row.month} onPointerEnter={() => setHoverMonth(row.month)} onPointerLeave={() => setHoverMonth(null)}>
              <rect x={groupX} y={padding.top} width={groupWidth} height={innerHeight} fill={hovered ? "#f8fafc" : "transparent"} />
              <rect x={center - barWidth - 2} y={yFor(row.revenue)} width={barWidth} height={Math.max(0, padding.top + innerHeight - yFor(row.revenue))} rx={3} fill={revenueColor} opacity={hovered ? 1 : 0.85} />
              <rect x={center + 2} y={yFor(row.costs)} width={barWidth} height={Math.max(0, padding.top + innerHeight - yFor(row.costs))} rx={3} fill={costsColor} opacity={hovered ? 1 : 0.85} />
              <text x={center} y={height - padding.bottom + 16} textAnchor="middle" className="fill-slate-500" fontSize={10}>{labelMonth(row.month)}</text>
              <text x={center} y={padding.top - 4} textAnchor="middle" className={row.profit < 0 ? "fill-rose-700" : "fill-emerald-700"} fontSize={10} fontWeight={700}>
                {row.profit < 0 ? "-" : "+"}{formatValue(Math.abs(row.profit))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
