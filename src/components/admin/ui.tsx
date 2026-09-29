"use client";

/**
 * Small, shared building blocks for the admin console. Styling lives in
 * src/styles/admin.css; these components only pick the right classes, so a
 * page never hand-writes colours and both themes stay in step.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export type Tone =
  | "brand" | "gold" | "success" | "warn" | "danger"
  | "info" | "violet" | "teal" | "muted";

/* ── Page header ─────────────────────────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="ad-page-head">
      <div style={{ minWidth: 0 }}>
        <h1 className="ad-page-title">{title}</h1>
        {subtitle && <p className="ad-page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="ad-page-actions">{actions}</div>}
    </header>
  );
}

/* ── Card ────────────────────────────────────────────────────────────────── */

export function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
  bodyClassName = "ad-card-body",
  style,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`ad-card ${className}`} style={style}>
      {(title || action) && (
        <div className="ad-card-head">
          <div style={{ minWidth: 0 }}>
            {title && (
              <h2 className="ad-card-title">
                {Icon && <Icon size={16} strokeWidth={2.2} style={{ color: "var(--ad-text-3)" }} />}
                {title}
              </h2>
            )}
            {subtitle && <p className="ad-card-sub">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/* ── Status badge ────────────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, Tone> = {
  pending: "warn",
  confirmed: "success",
  cancelled: "danger",
  published: "success",
  draft: "muted",
  scheduled: "info",
  approved: "success",
  hold: "warn",
  spam: "danger",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? "muted";
  return <span className={`ad-badge ad-tone-${tone}`}>{label ?? status}</span>;
}

export function Chip({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`ad-badge ad-badge--plain ad-tone-${tone}`}>{children}</span>;
}

/* ── Avatar (initials, colour picked stably from the name) ──────────────── */

const AVATAR_TONES: Tone[] = ["brand", "gold", "info", "violet", "teal", "danger"];

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <span className={`ad-avatar ad-tone-${tone} ${size !== "md" ? `ad-avatar--${size}` : ""}`} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
}

/* ── Segmented control with a sliding pill ──────────────────────────────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  id,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; count?: number }[];
  /** Unique per page, so two controls' pills never animate into each other. */
  id: string;
  ariaLabel: string;
}) {
  return (
    <div className="ad-seg" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            className="ad-seg-btn"
            onClick={() => onChange(o.value)}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="ad-seg-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
            {o.count !== undefined && <span className="ad-seg-count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Animated number ─────────────────────────────────────────────────────── */

export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(origin + (value - origin) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return <>{shown.toLocaleString("en-GB")}</>;
}

/* ── Trend indicator ─────────────────────────────────────────────────────── */

export function Trend({ current, previous, suffix = "vs last period" }: {
  current: number;
  previous: number;
  suffix?: string;
}) {
  if (previous === 0 && current === 0) {
    return <span className="ad-trend ad-trend--flat"><Minus size={13} /> No change</span>;
  }
  if (previous === 0) {
    return <span className="ad-trend ad-trend--up"><ArrowUpRight size={14} /> New <span style={{ fontWeight: 500, color: "var(--ad-text-3)" }}>{suffix}</span></span>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const dir = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  const Icon = dir === "up" ? ArrowUpRight : dir === "down" ? ArrowDownRight : Minus;
  return (
    <span className={`ad-trend ad-trend--${dir}`}>
      <Icon size={14} />
      {Math.abs(pct)}%
      <span style={{ fontWeight: 500, color: "var(--ad-text-3)" }}>{suffix}</span>
    </span>
  );
}

/* ── Empty & loading ─────────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="ad-empty">
      <div className="ad-empty-icon"><Icon size={24} strokeWidth={1.8} /></div>
      <div className="ad-empty-title">{title}</div>
      {text && <div className="ad-empty-text">{text}</div>}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}

export function Skeleton({ w = "100%", h = 14, r = 8, style }: {
  w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties;
}) {
  return <span className="ad-skel" style={{ display: "block", width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ padding: "8px 18px 18px", display: "grid", gap: 14 }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)`, gap: 16, alignItems: "center" }}>
          {Array.from({ length: cols }).map((__, j) => (
            <Skeleton key={j} h={j === 0 ? 30 : 12} w={j === 0 ? "80%" : "60%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Switch ──────────────────────────────────────────────────────────────── */

export function Switch({ checked, onChange, label }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="ad-switch">
      <input type="checkbox" role="switch" checked={checked} aria-label={label} onChange={(e) => onChange(e.target.checked)} />
      <span className="ad-switch-track" />
      <span className="ad-switch-thumb" />
    </label>
  );
}

/* ── Staggered entrance for grids of cards ──────────────────────────────── */

export function Reveal({ children, delay = 0, style, className }: {
  children: ReactNode; delay?: number; style?: React.CSSProperties; className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Confirm dialog ──────────────────────────────────────────────────────── */

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  tone = "danger",
  icon: Icon,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  icon: LucideIcon;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ad-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 , pointerEvents: "none" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
          <motion.div
            className="ad-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className={`ad-kpi-icon ad-tone-${tone === "danger" ? "danger" : "brand"}`} style={{ marginBottom: 14 }}>
              <Icon size={18} />
            </div>
            <h3 className="ad-modal-title">{title}</h3>
            <div className="ad-modal-text">{text}</div>
            <div className="ad-modal-actions">
              <button type="button" className="ad-btn" onClick={onCancel} autoFocus disabled={busy}>Cancel</button>
              <button
                type="button"
                className={`ad-btn ${tone === "danger" ? "ad-btn--danger" : "ad-btn--primary"}`}
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Query-string value, read once on mount ─────────────────────────────── */

/**
 * Deep links such as /admin/bookings?status=pending set a page's starting
 * filter. Read in an effect rather than with useSearchParams, which would
 * force a Suspense boundary around every admin page for a one-time value.
 */
export function useInitialParam(name: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    setValue(new URLSearchParams(window.location.search).get(name));
  }, [name]);
  return value;
}
