"use client";

/**
 * Hand-drawn SVG charts for the admin console. No chart library: the needs
 * are small (a trend, a breakdown, a sparkline), and SVG styled from the
 * admin tokens themes itself for free in light and dark.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ── Width tracking, so text and strokes render at true pixel size ──────── */

function useWidth<T extends HTMLElement>(fallback = 600) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** A tidy upper bound for the y-axis: 1, 2, 5 × 10ⁿ steps. */
function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** Smooth path through points (monotone-ish Catmull-Rom, clamped to 0). */
function smoothPath(pts: [number, number][], floorY: number) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = Math.min(floorY, p1[1] + (p2[1] - p0[1]) * t);
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = Math.min(floorY, p2[1] - (p3[1] - p1[1]) * t);
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/* ── Area / line chart ───────────────────────────────────────────────────── */

export interface Series {
  name: string;
  color: string; // a CSS colour or var()
  values: number[];
}

export function AreaChart({
  labels,
  series,
  height = 240,
  tickEvery,
  formatTip,
}: {
  labels: string[];
  series: Series[];
  height?: number;
  /** Show every nth x label; defaults to about seven labels across. */
  tickEvery?: number;
  formatTip?: (i: number) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();

  const pad = { top: 12, right: 12, bottom: 28, left: 34 };
  const w = Math.max(200, width);
  const h = height;
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const n = labels.length;

  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const floor = pad.top + innerH;
  const every = tickEvery ?? Math.max(1, Math.ceil(n / 7));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * innerW;
    const i = n <= 1 ? 0 : Math.round((rel / innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div className="po-chart" ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img"
        aria-label={`Chart of ${series.map((s) => s.name).join(" and ")} over ${n} periods`}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`${gid}-g${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={si === 0 ? 0.28 : 0.14} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line className="po-chart-grid" x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text className="po-chart-axis" x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
          </g>
        ))}

        {labels.map((l, i) =>
          i % every === 0 || i === n - 1 ? (
            <text key={i} className="po-chart-axis" x={x(i)} y={h - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
              {l}
            </text>
          ) : null,
        )}

        {series.map((s, si) => {
          const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
          const line = smoothPath(pts, floor);
          const area = `${line} L${x(n - 1)},${floor} L${x(0)},${floor} Z`;
          return (
            <g key={s.name}>
              <motion.path
                d={area}
                fill={`url(#${gid}-g${si})`}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              <motion.path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth={si === 0 ? 2.5 : 2}
                strokeDasharray={si === 0 ? undefined : "5 4"}
                strokeLinecap="round"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </g>
          );
        })}

        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={floor} stroke="var(--po-border-strong)" strokeWidth={1} />
            {series.map((s) => (
              <circle key={s.name} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4.5} fill="var(--po-surface)" stroke={s.color} strokeWidth={2.5} />
            ))}
          </g>
        )}

        <rect
          x={pad.left} y={pad.top} width={innerW} height={innerH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          style={{ cursor: "crosshair" }}
        />
      </svg>

      {hover !== null && (
        <div className="po-chart-tip" style={{ left: x(hover), top: Math.min(...series.map((s) => y(s.values[hover] ?? 0))) }}>
          <div style={{ opacity: 0.7, marginBottom: 4 }}>{formatTip ? formatTip(hover) : labels[hover]}</div>
          {series.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="po-legend-dot" style={{ background: s.color, margin: 0 }} />
              <span style={{ opacity: 0.8 }}>{s.name}</span>
              <strong style={{ marginLeft: "auto", paddingLeft: 12, fontSize: 13, display: "inline" }}>{s.values[hover] ?? 0}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Donut ───────────────────────────────────────────────────────────────── */

export interface Slice {
  label: string;
  value: number;
  color: string;
}

export function Donut({
  slices,
  size = 176,
  thickness = 22,
  centerLabel,
}: {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centerLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = total > 0 && slices.filter((s) => s.value > 0).length > 1 ? 3 : 0;

  const arcs = useMemo(() => {
    let offset = 0;
    return slices.map((s) => {
      const len = total ? (s.value / total) * c : 0;
      const arc = { ...s, len: Math.max(0, len - gap), offset };
      offset += len;
      return arc;
    });
  }, [slices, total, c, gap]);

  const shown = hover !== null ? slices[hover] : null;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--po-surface-3)" strokeWidth={thickness} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((a, i) =>
            a.len > 0 ? (
              <motion.circle
                key={a.label}
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={a.color}
                strokeWidth={hover === i ? thickness + 6 : thickness}
                strokeLinecap="butt"
                strokeDasharray={`${a.len} ${c - a.len}`}
                strokeDashoffset={-a.offset}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: hover === null || hover === i ? 1 : 0.35 }}
                transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.12 }}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                style={{ cursor: "pointer", transition: "stroke-width 0.15s" }}
              />
            ) : null,
          )}
        </g>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.03em", color: "var(--po-text)", lineHeight: 1 }}>
            {shown ? shown.value : total}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--po-text-3)", marginTop: 4, fontWeight: 600 }}>
            {shown ? shown.label : centerLabel}
          </div>
          {shown && total > 0 && (
            <div style={{ fontSize: 11, color: "var(--po-text-3)" }}>{Math.round((shown.value / total) * 100)}%</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sparkline ───────────────────────────────────────────────────────────── */

export function Sparkline({ values, color, width = 96, height = 30 }: {
  values: number[]; color: string; width?: number; height?: number;
}) {
  const gid = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - 2 - (v / max) * (height - 4),
  ] as [number, number]);
  const line = smoothPath(pts, height - 2);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${gid}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={`url(#${gid}-s)`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={color} />
    </svg>
  );
}
