"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FilePen,
  Hourglass,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { useAdminData, type ToastKind } from "@/context/AdminDataContext";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";

const KIND_ICON: Record<ToastKind, { icon: typeof CheckCircle2; tone: string }> = {
  success: { icon: CheckCircle2, tone: "ad-tone-success" },
  warn: { icon: AlertTriangle, tone: "ad-tone-warn" },
  danger: { icon: XCircle, tone: "ad-tone-danger" },
};

function ago(id: number) {
  // Toast ids are Date.now() + a fraction, so they double as timestamps.
  const s = Math.max(0, Math.round((Date.now() - id) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)} h ago`;
}

/**
 * Two things in one panel: what needs attention right now (from live data),
 * and what happened this session (the toast history).
 */
export function NotificationBell() {
  const { toasts, toastPanelOpen, toggleToastPanel, bookings, posts, pendingComments } = useAdminData();
  const wrapRef = useRef<HTMLDivElement>(null);

  const { admin } = useAuth();
  const perms = admin?.perms;
  const pendingBookings = can(perms, "bookings") ? bookings.filter((b) => b.status === "pending").length : 0;
  const comments = can(perms, "comments") ? pendingComments : 0;
  const review = can(perms, "posts.publish") ? posts.filter((p) => p.status === "pending").length : 0;
  const drafts = posts.filter((p) => p.status === "draft").length;

  const attention = [
    { n: pendingBookings, label: "booking", verb: "awaiting confirmation", href: "/admin/bookings?status=pending", icon: ClipboardList, tone: "ad-tone-warn" },
    { n: review, label: "staff post", verb: "waiting for your review", href: "/admin/posts?status=pending", icon: Hourglass, tone: "ad-tone-violet" },
    { n: comments, label: "comment", verb: "to moderate", href: "/admin/comments", icon: MessageSquare, tone: "ad-tone-info" },
    { n: drafts, label: "draft post", verb: "not yet published", href: "/admin/posts?status=draft", icon: FilePen, tone: "ad-tone-muted" },
  ].filter((a) => a.n > 0);

  const hasUrgent = pendingBookings > 0 || comments > 0 || review > 0;

  useEffect(() => {
    if (!toastPanelOpen) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) toggleToastPanel();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") toggleToastPanel(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [toastPanelOpen, toggleToastPanel]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="ad-icon-btn"
        onClick={toggleToastPanel}
        aria-label={hasUrgent ? "Notifications: items need attention" : "Notifications"}
        aria-expanded={toastPanelOpen}
        title="Notifications"
      >
        <Bell size={17} strokeWidth={2} />
        {hasUrgent && <span className="ad-dot ad-pulse" />}
      </button>

      <AnimatePresence>
        {toastPanelOpen && (
          <motion.div
            className="ad-popover"
            style={{ width: 340, padding: 0, overflow: "hidden" }}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 14 }}>Notifications</strong>
              {attention.length > 0 && (
                <span className="ad-badge ad-badge--plain ad-tone-danger">
                  {attention.reduce((s, a) => s + a.n, 0)} open
                </span>
              )}
            </div>

            <div className="ad-menu-label" style={{ padding: "4px 16px" }}>Needs attention</div>
            <div style={{ padding: "2px 8px 8px" }}>
              {attention.length === 0 ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 8px", color: "var(--ad-text-3)", fontSize: 13 }}>
                  <CheckCircle2 size={18} style={{ color: "var(--ad-success)" }} />
                  All caught up. Nothing is waiting on you.
                </div>
              ) : (
                attention.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link key={a.href} href={a.href} className="ad-menu-item" onClick={toggleToastPanel} style={{ padding: "9px 8px" }}>
                      <span className={`ad-kpi-icon ${a.tone}`} style={{ width: 32, height: 32 }}><Icon size={16} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ color: "var(--ad-text)" }}>{a.n} {a.label}{a.n === 1 ? "" : "s"}</strong>{" "}
                        <span style={{ color: "var(--ad-text-3)" }}>{a.verb}</span>
                      </span>
                      <ChevronRight size={15} style={{ color: "var(--ad-text-3)" }} />
                    </Link>
                  );
                })
              )}
            </div>

            <hr className="ad-divider" />
            <div className="ad-menu-label" style={{ padding: "10px 16px 4px" }}>Recent activity</div>
            <div style={{ maxHeight: 220, overflowY: "auto", padding: "0 8px 10px" }}>
              {toasts.length === 0 ? (
                <div style={{ padding: "8px 8px 6px", color: "var(--ad-text-3)", fontSize: 12.5 }}>
                  Actions you take this session appear here.
                </div>
              ) : (
                toasts.slice(0, 15).map((t) => {
                  const { icon: Icon, tone } = KIND_ICON[t.kind];
                  return (
                    <div key={t.id} style={{ display: "flex", gap: 10, padding: "8px", alignItems: "flex-start" }}>
                      <span className={tone} style={{ color: "var(--tone)", marginTop: 1 }}><Icon size={15} /></span>
                      <span style={{ flex: 1, fontSize: 12.5, color: "var(--ad-text-2)", lineHeight: 1.45 }}>{t.msg}</span>
                      <span style={{ fontSize: 11, color: "var(--ad-text-3)", whiteSpace: "nowrap" }}>{ago(t.id)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
