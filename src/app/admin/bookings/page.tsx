"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownUp,
  Ban,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Hourglass,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
  XCircle,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import type { AdminBooking } from "@/lib/wp-bookings";
import {
  Avatar,
  Chip,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SkeletonRows,
  StatusBadge,
  type Tone,
  useInitialParam,
} from "@/components/admin/ui";
import { downloadCsv } from "@/lib/csv";
import { addDays, formatDay, fromNow, keyOfTimestamp, relativeDay, todayKey } from "@/lib/admin-dates";

type StatusFilter = "all" | AdminBooking["status"];
type When = "all" | "today" | "week" | "upcoming" | "past";
type Sort = "received" | "appointment";

const TYPE_META: Record<AdminBooking["type"], { label: string; tone: Tone }> = {
  consultation: { label: "New consult", tone: "info" },
  followup: { label: "Follow-up", tone: "violet" },
  test: { label: "Test / lab", tone: "teal" },
};

export default function BookingsPage() {
  const {
    bookings, bookingsLoading, bookingsError, refreshBookings,
    confirmBooking, cancelBooking, addToast,
  } = useAdminData();

  const initialStatus = useInitialParam("status");
  const initialOpen = useInitialParam("open");

  const [status, setStatus] = useState<StatusFilter>("all");
  const [dept, setDept] = useState("all");
  const [type, setType] = useState<"all" | AdminBooking["type"]>("all");
  const [when, setWhen] = useState<When>("all");
  const [sort, setSort] = useState<Sort>("received");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [toCancel, setToCancel] = useState<AdminBooking[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initialStatus === "pending" || initialStatus === "confirmed" || initialStatus === "cancelled") setStatus(initialStatus);
  }, [initialStatus]);

  // ?open=<reference> — from the command palette — opens that booking.
  useEffect(() => {
    if (!initialOpen || !bookings.length) return;
    const match = bookings.find((b) => b.id === initialOpen);
    if (match) setOpenId(match.databaseId);
  }, [initialOpen, bookings]);

  const today = todayKey();
  const depts = useMemo(
    () => Array.from(new Set(bookings.map((b) => b.dept).filter(Boolean))).sort(),
    [bookings],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const weekEnd = addDays(today, 6);
    const list = bookings.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (dept !== "all" && b.dept !== dept) return false;
      if (type !== "all" && b.type !== type) return false;
      const d = b.preferredDateISO;
      if (when === "today" && d !== today) return false;
      if (when === "week" && !(d >= today && d <= weekEnd)) return false;
      if (when === "upcoming" && !(d >= today)) return false;
      if (when === "past" && !(d && d < today)) return false;
      if (q && !`${b.name} ${b.id} ${b.phone} ${b.email} ${b.dept}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return list.sort((a, b) =>
      sort === "received"
        ? b.createdAtISO.localeCompare(a.createdAtISO)
        : (a.preferredDateISO + a.time).localeCompare(b.preferredDateISO + b.time),
    );
  }, [bookings, status, dept, type, when, query, sort, today]);

  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(filtered.map((b) => b.databaseId));
      const next = new Set(Array.from(prev).filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const open = bookings.find((b) => b.databaseId === openId) ?? null;
  const selectedList = bookings.filter((b) => selected.has(b.databaseId));
  const allSelected = filtered.length > 0 && filtered.every((b) => selected.has(b.databaseId));
  const filtersOn = status !== "all" || dept !== "all" || type !== "all" || when !== "all" || query !== "";

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const runAll = async (list: AdminBooking[], fn: (id: number) => Promise<void>) => {
    setBusy(true);
    for (const b of list) await fn(b.databaseId);
    setBusy(false);
    setSelected(new Set());
  };

  const confirmMany = (list: AdminBooking[]) => runAll(list.filter((b) => b.status === "pending"), confirmBooking);
  const doCancel = async () => {
    if (!toCancel) return;
    await runAll(toCancel.filter((b) => b.status !== "cancelled"), cancelBooking);
    setToCancel(null);
  };

  const exportCSV = () => {
    const headers = ["Reference", "Patient", "Phone", "Email", "Department", "Type", "Appointment date", "Time", "Insurance", "Insurance no.", "Status", "Received", "Notes"];
    const rows = filtered.map((b) => [
      b.id, b.name, b.phone, b.email, b.dept, TYPE_META[b.type].label, b.preferredDateISO, b.time,
      b.insurance, b.insuranceNumber ?? "", b.status, keyOfTimestamp(b.createdAtISO), b.notes ?? "",
    ]);
    downloadCsv(`sech-bookings-${today}.csv`, headers, rows);
    addToast(`Exported ${rows.length} booking${rows.length === 1 ? "" : "s"}`);
  };

  const refresh = async () => {
    setRefreshing(true);
    await refreshBookings();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setStatus("all"); setDept("all"); setType("all"); setWhen("all"); setQuery("");
  };

  const closeDrawer = useCallback(() => setOpenId(null), []);

  const TILES: { key: StatusFilter; label: string; icon: typeof ClipboardList; tone: Tone }[] = [
    { key: "all", label: "All bookings", icon: ClipboardList, tone: "brand" },
    { key: "pending", label: "Awaiting confirmation", icon: Hourglass, tone: "warn" },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle2, tone: "success" },
    { key: "cancelled", label: "Cancelled", icon: XCircle, tone: "danger" },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Appointment requests from the website, newest first"
        actions={
          <>
            <button type="button" className="po-btn" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "po-spin" : ""} />Refresh
            </button>
            <button type="button" className="po-btn po-btn--primary" onClick={exportCSV} disabled={!filtered.length}>
              <Download size={15} />Export {filtersOn ? "filtered" : "all"}
            </button>
          </>
        }
      />

      {/* Status tiles double as the status filter. */}
      <div className="po-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 16 }}>
        {TILES.map((t) => {
          const Icon = t.icon;
          const active = status === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`po-card po-card--hover po-kpi po-tone-${t.tone} po-bk-tile`}
              data-active={active}
              aria-pressed={active}
              onClick={() => setStatus(t.key)}
            >
              <div className="po-kpi-top">
                <span className="po-kpi-label">{t.label}</span>
                <span className="po-kpi-icon"><Icon size={17} /></span>
              </div>
              <div className="po-kpi-value">{counts[t.key]}</div>
            </button>
          );
        })}
      </div>

      <section className="po-card">
        <div className="po-toolbar">
          <div className="po-input-wrap" style={{ flex: "1 1 240px", maxWidth: 340 }}>
            <Search size={15} />
            <input className="po-input" placeholder="Name, reference, phone or email" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search bookings" />
          </div>
          <select className="po-select" style={{ width: 190 }} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
            <option value="all">All departments</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="po-select" style={{ width: 150 }} value={type} onChange={(e) => setType(e.target.value as typeof type)} aria-label="Type">
            <option value="all">All types</option>
            {(Object.keys(TYPE_META) as AdminBooking["type"][]).map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
          </select>
          <select className="po-select" style={{ width: 160 }} value={when} onChange={(e) => setWhen(e.target.value as When)} aria-label="Appointment date">
            <option value="all">Any date</option>
            <option value="today">Today</option>
            <option value="week">Next 7 days</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
          <button
            type="button"
            className="po-btn po-btn--ghost"
            onClick={() => setSort((s) => (s === "received" ? "appointment" : "received"))}
            title="Change sort order"
            style={{ marginLeft: "auto" }}
          >
            <ArrowDownUp size={15} />
            {sort === "received" ? "Newest request" : "Appointment date"}
          </button>
          {filtersOn && (
            <button type="button" className="po-btn po-btn--ghost" onClick={clearFilters}><X size={15} />Clear</button>
          )}
        </div>
        <hr className="po-divider" />

        {bookingsLoading && bookings.length === 0 ? (
          <SkeletonRows rows={6} cols={6} />
        ) : bookingsError ? (
          <EmptyState icon={AlertTriangle} title="Couldn’t load bookings" text={bookingsError}
            action={<button type="button" className="po-btn" onClick={refresh}><RefreshCw size={15} />Try again</button>} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={bookings.length ? "No bookings match" : "No bookings yet"}
            text={bookings.length ? "Try widening the filters." : "Requests made through the website’s booking form appear here."}
            action={filtersOn ? <button type="button" className="po-btn" onClick={clearFilters}><X size={15} />Clear filters</button> : undefined}
          />
        ) : (
          <div className="po-table-wrap">
            <table className="po-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input type="checkbox" className="po-cb" checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map((b) => b.databaseId)))}
                      aria-label="Select all visible bookings" />
                  </th>
                  <th>Patient</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Appointment</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.databaseId} data-clickable="true" data-selected={selected.has(b.databaseId)} onClick={() => setOpenId(b.databaseId)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="po-cb" checked={selected.has(b.databaseId)} onChange={() => toggle(b.databaseId)} aria-label={`Select ${b.name}`} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                        <Avatar name={b.name} />
                        <div style={{ minWidth: 0 }}>
                          <div className="po-cell-main">{b.name}</div>
                          <div className="po-cell-sub">{b.id} · {b.phone || "No phone"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{b.dept || "Not set"}</td>
                    <td><Chip tone={TYPE_META[b.type].tone}>{TYPE_META[b.type].label}</Chip></td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div className="po-cell-main" style={{ fontWeight: 600 }}>
                        {b.preferredDateISO ? relativeDay(b.preferredDateISO) : "No date"}
                      </div>
                      <div className="po-cell-sub">
                        {b.time || "Any time"}
                        {b.preferredDateISO && b.preferredDateISO < today && b.status === "pending" && (
                          <span style={{ color: "var(--po-danger)", fontWeight: 600 }}> · date passed</span>
                        )}
                      </div>
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="po-row-actions">
                        {b.status === "pending" && (
                          <button type="button" className="po-btn po-btn--sm po-btn--success-soft" onClick={() => confirmMany([b])} disabled={busy} aria-label={`Confirm ${b.name}`}>
                            <Check size={14} strokeWidth={2.6} />Confirm
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button type="button" className="po-btn po-btn--sm po-btn--ghost po-btn--icon" onClick={() => setToCancel([b])} disabled={busy}
                            title="Cancel booking" aria-label={`Cancel ${b.name}'s booking`} style={{ color: "var(--po-danger)" }}>
                            <Ban size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div style={{ padding: "10px 18px", fontSize: 12.5, color: "var(--po-text-3)", borderTop: "1px solid var(--po-border)" }}>
            Showing {filtered.length} of {bookings.length} bookings
          </div>
        )}
      </section>

      {/* Bulk bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            className="po-bulkbar"
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 24, x: "-50%" }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            role="toolbar"
            aria-label="Bulk actions"
          >
            <strong>{selected.size} selected</strong>
            <span className="po-bulkbar-sep" />
            <button type="button" className="po-btn po-btn--sm po-btn--gold" disabled={busy || !selectedList.some((b) => b.status === "pending")} onClick={() => confirmMany(selectedList)}>
              <Check size={14} />Confirm
            </button>
            <button type="button" className="po-btn po-btn--sm po-btn--danger-soft" disabled={busy || !selectedList.some((b) => b.status !== "cancelled")} onClick={() => setToCancel(selectedList)}>
              <Ban size={14} />Cancel
            </button>
            <button type="button" className="po-btn po-btn--sm po-btn--ghost po-btn--icon" onClick={() => setSelected(new Set())} aria-label="Clear selection">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <BookingDrawer
        booking={open}
        onClose={closeDrawer}
        onConfirm={(b) => confirmMany([b])}
        onCancel={(b) => setToCancel([b])}
        busy={busy}
        onCopy={(text) => {
          navigator.clipboard?.writeText(text).then(() => addToast("Reference copied"), () => {});
        }}
      />

      <ConfirmDialog
        open={!!toCancel}
        icon={Ban}
        title={toCancel && toCancel.length > 1 ? `Cancel ${toCancel.length} bookings?` : "Cancel this booking?"}
        text={
          toCancel && toCancel.length === 1
            ? <>{toCancel[0].name}’s {TYPE_META[toCancel[0].type].label.toLowerCase()} appointment{toCancel[0].preferredDateISO ? ` on ${formatDay(toCancel[0].preferredDateISO, { weekday: "long", day: "numeric", month: "long" })}` : ""} will be marked as cancelled. Please let the patient know.</>
            : <>These appointments will be marked as cancelled. Please let the patients know.</>
        }
        confirmLabel="Cancel booking"
        busy={busy}
        onConfirm={doCancel}
        onCancel={() => setToCancel(null)}
      />

      <style>{`
        .po-bk-tile { text-align: left; font: inherit; cursor: pointer; width: 100%; }
        .po-bk-tile[data-active="true"] { border-color: var(--tone); box-shadow: 0 0 0 1px var(--tone), var(--po-shadow-md); }
        .po-bk-tile:not([data-active="true"])::after { opacity: 0.35; }
      `}</style>
    </>
  );
}

function BookingDrawer({ booking, onClose, onConfirm, onCancel, onCopy, busy }: {
  booking: AdminBooking | null;
  onClose: () => void;
  onConfirm: (b: AdminBooking) => void;
  onCancel: (b: AdminBooking) => void;
  onCopy: (text: string) => void;
  busy: boolean;
}) {
  useEffect(() => {
    if (!booking) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booking, onClose]);

  return (
    <>
    <AnimatePresence>
      {booking && (
        <motion.div
          className="po-overlay po-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 , pointerEvents: "none" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.aside
            className="po-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Booking for ${booking.name}`}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }} /* same unit as initial/exit — a 0 ↔ "100%" mix never finished exiting */
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="po-drawer-head">
              <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                <Avatar name={booking.name} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 750, color: "var(--po-text)" }}>{booking.name}</div>
                  <button type="button" onClick={() => onCopy(booking.id)} className="po-copy" title="Copy reference">
                    {booking.id}<Copy size={12} />
                  </button>
                </div>
              </div>
              <button type="button" className="po-btn po-btn--ghost po-btn--icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>

            <div className="po-drawer-body">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                <StatusBadge status={booking.status} />
                <Chip tone={TYPE_META[booking.type].tone}>{TYPE_META[booking.type].label}</Chip>
              </div>

              <div className="po-appt-card">
                <CalendarClock size={22} />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--po-text)", fontSize: 15 }}>
                    {booking.preferredDateISO
                      ? formatDay(booking.preferredDateISO, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                      : "No date chosen"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--po-text-2)" }}>
                    {booking.time || "Any time"}{booking.preferredDateISO ? ` · ${fromNow(booking.preferredDateISO)}` : ""}
                  </div>
                </div>
              </div>

              <h3 className="po-drawer-h">Patient</h3>
              <dl className="po-dl">
                <dt>Phone</dt><dd>{booking.phone || "Not given"}</dd>
                <dt>Email</dt><dd>{booking.email || "Not given"}</dd>
                {booking.dateOfBirth && (<><dt>Date of birth</dt><dd>{formatDay(booking.dateOfBirth, { day: "numeric", month: "long", year: "numeric" })}</dd></>)}
                {booking.gender && (<><dt>Gender</dt><dd style={{ textTransform: "capitalize" }}>{booking.gender}</dd></>)}
              </dl>

              <h3 className="po-drawer-h">Appointment</h3>
              <dl className="po-dl">
                <dt><Stethoscope size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Department</dt><dd>{booking.dept || "Not set"}</dd>
                <dt><ShieldCheck size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Insurance</dt>
                <dd>{booking.insurance}{booking.insuranceNumber ? ` · ${booking.insuranceNumber}` : ""}</dd>
                <dt><CalendarDays size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Received</dt><dd>{booking.createdAt || "Unknown"}</dd>
              </dl>

              {booking.notes && (
                <>
                  <h3 className="po-drawer-h">Notes from the patient</h3>
                  {/* Visitor-supplied: rendered as text, never markup. */}
                  <p className="po-notes">{booking.notes}</p>
                </>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap" }}>
                {booking.phone && <a className="po-btn" href={`tel:${booking.phone.replace(/\s+/g, "")}`}><Phone size={15} />Call</a>}
                {booking.email && <a className="po-btn" href={`mailto:${booking.email}?subject=${encodeURIComponent(`Your appointment at St. Elizabeth Catholic Hospital (${booking.id})`)}`}><Mail size={15} />Email</a>}
              </div>
            </div>

            <div className="po-drawer-foot">
              {booking.status !== "cancelled" && (
                <button type="button" className="po-btn po-btn--danger-soft" onClick={() => onCancel(booking)} disabled={busy}>
                  <Ban size={15} />Cancel booking
                </button>
              )}
              {booking.status === "pending" && (
                <button type="button" className="po-btn po-btn--primary" onClick={() => onConfirm(booking)} disabled={busy}>
                  <Check size={15} strokeWidth={2.6} />Confirm booking
                </button>
              )}
              {booking.status !== "pending" && (
                <button type="button" className="po-btn" onClick={onClose}>Close</button>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
      <style>{`
        .po-copy { display: inline-flex; align-items: center; gap: 6px; border: 0; background: none; padding: 0; font: inherit; font-size: 12.5px; color: var(--po-text-3); cursor: pointer; }
        .po-copy:hover { color: var(--po-brand-ink); }
        .po-appt-card { display: flex; gap: 14px; align-items: center; padding: 14px 16px; border-radius: 12px; background: var(--po-brand-soft); color: var(--po-brand-ink); margin-bottom: 8px; }
        .po-drawer-h { font-size: 11.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--po-text-3); margin: 22px 0 10px; }
        .po-notes { margin: 0; padding: 12px 14px; border-radius: 10px; background: var(--po-surface-2); border: 1px solid var(--po-border); font-size: 13.5px; line-height: 1.65; color: var(--po-text-2); white-space: pre-wrap; overflow-wrap: anywhere; }
      `}</style>
    </>
  );
}
