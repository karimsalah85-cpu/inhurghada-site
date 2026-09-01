"use client";

import { useId, useState } from "react";

type Point = { date: string; value: number };

const width = 720;
const height = 220;
const padding = { top: 16, right: 16, bottom: 28, left: 44 };

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

/** A single-series line + area trend chart. One axis, one hue, gridlines, hover crosshair — no library dependency. */
export default function TrendChart({
  data,
  label,
  color = "#2563eb",
  formatValue = (value: number) => String(Math.round(value)),
  formatDate,
}: {
  data: Point[];
  label: string;
  color?: string;
  formatValue?: (value: number) => string;
  formatDate: (date: string) => string;
}) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="grid h-56 place-items-center rounded-xl bg-slate-50 text-sm text-slate-500">
        No scheduled activity matches these filters.
      </div>
    );
  }

  const max = niceMax(Math.max(...data.map((point) => point.value)));
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const xFor = (index: number) =>
    padding.left + (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
  const yFor = (value: number) => padding.top + innerHeight - (value / max) * innerHeight;

  const linePath = data.map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index)},${yFor(point.value)}`).join(" ");
  const areaPath = `${linePath} L${xFor(data.length - 1)},${padding.top + innerHeight} L${xFor(0)},${padding.top + innerHeight} Z`;

  const yTicks = [0, max / 2, max];
  // Thin out x-axis labels so they never collide: show at most ~7 across the width.
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  function handleMove(event: React.PointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (data.length - 1));
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${label} by day, ranging from ${formatValue(0)} to ${formatValue(max)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padding.left - 8} y={yFor(tick)} textAnchor="end" dominantBaseline="middle" className="fill-slate-400" fontSize={10}>
              {formatValue(tick)}
            </text>
          </g>
        ))}

        {data.map((point, index) =>
          index % labelEvery === 0 || index === data.length - 1 ? (
            <text key={point.date} x={xFor(index)} y={height - 8} textAnchor="middle" className="fill-slate-400" fontSize={10}>
              {formatDate(point.date)}
            </text>
          ) : null,
        )}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((point, index) => (
          <circle
            key={point.date}
            cx={xFor(index)}
            cy={yFor(point.value)}
            r={index === hoverIndex || index === data.length - 1 ? 4.5 : 3}
            fill={color}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}

        {hovered ? (
          <line x1={xFor(hoverIndex!)} x2={xFor(hoverIndex!)} y1={padding.top} y2={padding.top + innerHeight} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3,3" />
        ) : null}

        <text x={xFor(data.length - 1)} y={yFor(data[data.length - 1].value) - 10} textAnchor="end" className="fill-slate-900" fontSize={11} fontWeight={700}>
          {formatValue(data[data.length - 1].value)}
        </text>

        <rect
          x={padding.left}
          y={padding.top}
          width={innerWidth}
          height={innerHeight}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>
      {hovered ? (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg"
          style={{ left: `${(xFor(hoverIndex!) / width) * 100}%` }}
        >
          <p className="text-[10px] font-semibold text-slate-300">{formatDate(hovered.date)}</p>
          <p>{label}: {formatValue(hovered.value)}</p>
        </div>
      ) : null}
    </div>
  );
}
