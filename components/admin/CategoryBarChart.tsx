"use client";

import { useState } from "react";

type Item = { label: string; value: number };

const rowHeight = 34;
const barHeight = 20;
const padding = { top: 8, right: 88, bottom: 8, left: 132 };

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

/** A horizontal categorical bar chart — one hue, direct end-labels, hover highlight. No axis needed past the labels since values are labeled directly. */
export default function CategoryBarChart({
  items,
  color = "#2563eb",
  formatValue,
}: {
  items: Item[];
  color?: string;
  formatValue: (value: number) => string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const sorted = [...items].filter((item) => item.value !== 0).sort((a, b) => b.value - a.value);

  if (!sorted.length) {
    return <div className="grid h-24 place-items-center rounded-xl bg-slate-50 text-sm text-slate-500">No data for this period.</div>;
  }

  const max = niceMax(Math.max(...sorted.map((item) => item.value)));
  const width = 520;
  const innerWidth = width - padding.left - padding.right;
  const height = padding.top + padding.bottom + sorted.length * rowHeight;
  const xFor = (value: number) => (value / max) * innerWidth;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Bar chart of ${sorted.map((item) => `${item.label}: ${formatValue(item.value)}`).join(", ")}`}>
      {sorted.map((item, index) => {
        const y = padding.top + index * rowHeight;
        const barWidth = Math.max(2, xFor(item.value));
        const hovered = hoverIndex === index;
        return (
          <g
            key={item.label}
            onPointerEnter={() => setHoverIndex(index)}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <rect x={0} y={y} width={width} height={rowHeight} fill={hovered ? "#f8fafc" : "transparent"} />
            <text x={padding.left - 10} y={y + rowHeight / 2} textAnchor="end" dominantBaseline="middle" className="fill-slate-700" fontSize={12} fontWeight={600}>
              {item.label.length > 22 ? `${item.label.slice(0, 21)}…` : item.label}
            </text>
            <rect x={padding.left} y={y + (rowHeight - barHeight) / 2} width={innerWidth} height={barHeight} rx={4} className="fill-slate-100" />
            <rect x={padding.left} y={y + (rowHeight - barHeight) / 2} width={barWidth} height={barHeight} rx={4} fill={color} opacity={hovered ? 1 : 0.85} />
            <text x={padding.left + barWidth + 8} y={y + rowHeight / 2} dominantBaseline="middle" className="fill-slate-900" fontSize={12} fontWeight={700}>
              {formatValue(item.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
