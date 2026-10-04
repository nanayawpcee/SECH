"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Stethoscope,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import type { AdminBooking } from "@/lib/wp-bookings";
import { Avatar, EmptyState, PageHeader, Skeleton, StatusBadge } from "@/components/admin/ui";
import { dayKey, formatDay, fromNow, todayKey } from "@/lib/admin-dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLOR: Record<AdminBooking["status"], string> = {
  pending: "var(--po-warn)",
  confirmed: "var(--po-success)",
  cancelled: "var(--po-danger)",
};

/** Six rows of seven days, Monday first, including the neighbouring months. */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { key: dayKey(d), day: d.getDate(), inMonth: d.getMonth() === month, weekend: d.getDay() === 0 || d.getDay() === 6 };
  });
}

const byTime = (a: AdminBooking, b: AdminBooking) => (a.time || "").localeCompare(b.time || "");

export default function CalendarPage() {
  const { bookings, bookingsLoading } = useAdminData();
  const now = new Date();
  const today = todayKey();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string>(today);
  const [view, setView] = useState<"month" | "agenda">("month");
  const [dir, setDir] = useState(0);

  const byDay = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const b of bookings) {
      if (!b.preferredDateISO) continue;
      const list = map.get(b.preferredDateISO) ?? [];
      list.push(b);
      map.set(b.preferredDateISO, list);
    }
    map.forEach((list) => list.sort(byTime));
    return map;
  }, [bookings]);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const monthBookings = useMemo(
    () => bookings.filter((b) => b.preferredDateISO.startsWith(monthPrefix)),
    [bookings, monthPrefix],
  );
  const monthCounts = {
    pending: monthBookings.filter((b) => b.status === "pending").length,
    confirmed: monthBookings.filter((b) => b.status === "confirmed").length,
    cancelled: monthBookings.filter((b) => b.status === "cancelled").length,
  };

  const step = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setDir(delta);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(dayKey(d));
  };
  const goToday = () => {
    setDir(0);
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelected(today);
  };

  // Arrow keys page through months when nothing else has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || e.metaKey || e.ctrlKey) return;
      if (e.key === "ArrowLeft" && e.shiftKey) step(-1);
      if (e.key === "ArrowRight" && e.shiftKey) step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const dayList = byDay.get(selected) ?? [];
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const agendaDays = useMemo(() => {
    const keys = Array.from(new Set(monthBookings.map((b) => b.preferredDateISO))).sort();
    return keys.map((k) => ({ key: k, list: byDay.get(k) ?? [] }));
  }, [monthBookings, byDay]);

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle={`${monthBookings.length} appointment${monthBookings.length === 1 ? "" : "s"} in ${monthLabel}`}
        actions={
          <>
            <div className="po-seg" role="group" aria-label="View">
              <button type="button" className="po-seg-btn" aria-pressed={view === "month"} onClick={() => setView("month")}>
                {view === "month" && <motion.span layoutId="cal-view" className="po-seg-pill" />}
                <CalendarRange size={15} />Month
              </button>
              <button type="button" className="po-seg-btn" aria-pressed={view === "agenda"} onClick={() => setView("agenda")}>
                {view === "agenda" && <motion.span layoutId="cal-view" className="po-seg-pill" />}
                <List size={15} />Agenda
              </button>
            </div>
            <button type="button" className="po-btn" onClick={goToday}>Today</button>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button type="button" className="po-btn po-btn--icon" onClick={() => step(-1)} aria-label="Previous month" title="Previous month (Shift + ←)"><ChevronLeft size={17} /></button>
              <div className="po-cal-month" aria-live="polite">{monthLabel}</div>
              <button type="button" className="po-btn po-btn--icon" onClick={() => step(1)} aria-label="Next month" title="Next month (Shift + →)"><ChevronRight size={17} /></button>
            </div>
          </>
        }
      />

      <div className="po-cal-layout">
        <section className="po-card" style={{ overflow: "hidden" }}>
          {view === "month" ? (
            <>
              <div className="po-cal-head">
                {WEEKDAYS.map((d, i) => <div key={d} data-weekend={i >= 5}>{d}</div>)}
              </div>
              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.div
                  key={`${year}-${month}`}
                  className="po-cal-grid"
                  initial={{ opacity: 0, x: dir * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -24 }}
                  transition={{ duration: 0.2 }}
                >
                  {cells.map((c) => {
                    const list = byDay.get(c.key) ?? [];
                    const live = list.filter((b) => b.status !== "cancelled");
                    return (
                      <button
                        key={c.key}
                        type="button"
                        className="po-cal-cell"
                        data-out={!c.inMonth}
                        data-weekend={c.weekend}
                        data-today={c.key === today}
                        data-selected={c.key === selected}
                        onClick={() => setSelected(c.key)}
                        aria-label={`${formatDay(c.key, { weekday: "long", day: "numeric", month: "long" })}, ${list.length} appointment${list.length === 1 ? "" : "s"}`}
                      >
                        <span className="po-cal-day">{c.day}</span>
                        {bookingsLoading ? null : (
                          <span className="po-cal-items">
                            {list.slice(0, 3).map((b) => (
                              <span key={b.databaseId} className="po-cal-pill" data-status={b.status} style={{ ["--c" as string]: STATUS_COLOR[b.status] }}>
                                <span className="po-cal-pill-time">{b.time ? b.time.replace(/\s?(AM|PM)/i, (m) => m.trim().toLowerCase()[0]) : ""}</span>
                                {b.name.split(" ")[0]}
                              </span>
                            ))}
                            {list.length > 3 && <span className="po-cal-more">+{list.length - 3} more</span>}
                          </span>
                        )}
                        {live.length > 0 && <span className="po-cal-count">{live.length}</span>}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <div style={{ padding: "8px 8px 12px" }}>
              {bookingsLoading ? (
                <div style={{ display: "grid", gap: 12, padding: 10 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={56} r={10} />)}</div>
              ) : agendaDays.length === 0 ? (
                <EmptyState icon={CalendarDays} title={`Nothing booked in ${monthLabel}`} text="Use the arrows to look at another month." />
              ) : (
                agendaDays.map(({ key, list }) => (
                  <div key={key} className="po-agenda-day" data-today={key === today}>
                    <button type="button" className="po-agenda-date" onClick={() => { setSelected(key); setView("month"); }}>
                      <span>{formatDay(key, { weekday: "short" })}</span>
                      <strong>{formatDay(key, { day: "numeric" })}</strong>
                    </button>
                    <div style={{ flex: 1, display: "grid", gap: 6 }}>
                      {list.map((b) => <ApptRow key={b.databaseId} b={b} />)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Day detail */}
        <aside className="po-cal-side">
          <section className="po-card">
            <div className="po-card-head" style={{ paddingBottom: 8 }}>
              <div>
                <h2 className="po-card-title">{formatDay(selected, { weekday: "long", day: "numeric", month: "long" })}</h2>
                <p className="po-card-sub" style={{ textTransform: "capitalize" }}>
                  {fromNow(selected)} · {dayList.length} appointment{dayList.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div style={{ padding: "0 10px 12px" }}>
              {dayList.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Nothing booked" text="Pick another day to see its appointments." />
              ) : (
                <div style={{ display: "grid", gap: 6 }}>{dayList.map((b) => <ApptRow key={b.databaseId} b={b} />)}</div>
              )}
            </div>
          </section>

          <section className="po-card" style={{ marginTop: 16 }}>
            <div className="po-card-head"><h2 className="po-card-title">{monthLabel.split(" ")[0]} at a glance</h2></div>
            <div className="po-card-body" style={{ display: "grid", gap: 10 }}>
              {(["confirmed", "pending", "cancelled"] as const).map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <span className="po-legend-dot" style={{ background: STATUS_COLOR[s], margin: 0 }} />
                  <span style={{ flex: 1, color: "var(--po-text-2)", textTransform: "capitalize" }}>{s}</span>
                  <strong>{monthCounts[s]}</strong>
                </div>
              ))}
              <p className="po-hint" style={{ margin: "4px 0 0" }}>Tip: Shift + ← / → moves between months.</p>
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .po-cal-month { min-width: 150px; text-align: center; font-weight: 700; font-size: 14px; color: var(--po-text); }
        .po-cal-layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
        .po-cal-side { position: sticky; top: 0; }
        @media (max-width: 1100px) { .po-cal-layout { grid-template-columns: minmax(0, 1fr); } .po-cal-side { position: static; } }
        .po-cal-head { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--po-border); background: var(--po-surface-2); }
        .po-cal-head div { padding: 10px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--po-text-3); }
        .po-cal-head div[data-weekend="true"] { color: var(--po-text-3); opacity: .7; }
        .po-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: minmax(104px, 1fr); }
        .po-cal-cell {
          position: relative; text-align: left; font: inherit;
          border: 0; border-right: 1px solid var(--po-border); border-bottom: 1px solid var(--po-border);
          background: var(--po-surface); padding: 8px; cursor: pointer;
          display: flex; flex-direction: column; gap: 5px; min-width: 0;
          transition: background .12s;
        }
        .po-cal-cell:nth-child(7n) { border-right: 0; }
        .po-cal-cell[data-weekend="true"] { background: var(--po-surface-2); }
        .po-cal-cell[data-out="true"] .po-cal-day { color: var(--po-text-3); opacity: .55; }
        .po-cal-cell:hover { background: var(--po-surface-3); }
        .po-cal-cell[data-selected="true"] { background: var(--po-brand-soft); box-shadow: inset 0 0 0 2px var(--po-brand-ink); z-index: 1; }
        .po-cal-day { font-size: 13px; font-weight: 700; color: var(--po-text); width: 26px; height: 26px; display: grid; place-items: center; border-radius: 50%; }
        .po-cal-cell[data-today="true"] .po-cal-day { background: var(--po-brand); color: #fff; }
        .po-cal-items { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .po-cal-pill {
          display: flex; gap: 5px; align-items: center; min-width: 0;
          font-size: 11.5px; font-weight: 600; color: var(--po-text);
          padding: 2px 6px; border-radius: 5px;
          background: color-mix(in srgb, var(--c) 14%, transparent);
          border-left: 3px solid var(--c);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .po-cal-pill[data-status="cancelled"] { text-decoration: line-through; opacity: .6; }
        .po-cal-pill-time { color: var(--po-text-3); font-weight: 500; }
        .po-cal-more { font-size: 11px; color: var(--po-text-3); padding-left: 4px; }
        .po-cal-count { position: absolute; top: 9px; right: 9px; font-size: 10.5px; font-weight: 700; color: var(--po-brand-ink); }
        .po-appt { display: flex; gap: 10px; align-items: center; padding: 10px; border-radius: 10px; text-decoration: none; color: inherit; border: 1px solid transparent; transition: background .12s, border-color .12s; }
        .po-appt:hover { background: var(--po-surface-2); border-color: var(--po-border); }
        .po-agenda-day { display: flex; gap: 14px; padding: 12px 10px; border-bottom: 1px solid var(--po-border); }
        .po-agenda-day:last-child { border-bottom: 0; }
        .po-agenda-date { width: 52px; flex-shrink: 0; border: 0; border-radius: 12px; padding: 8px 0; background: var(--po-surface-3); cursor: pointer; font: inherit; line-height: 1.1; text-align: center; height: fit-content; }
        .po-agenda-date span { display: block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--po-text-3); }
        .po-agenda-date strong { display: block; font-size: 20px; color: var(--po-text); }
        .po-agenda-day[data-today="true"] .po-agenda-date { background: var(--po-brand); }
        .po-agenda-day[data-today="true"] .po-agenda-date span, .po-agenda-day[data-today="true"] .po-agenda-date strong { color: #fff; }
        @media (max-width: 700px) {
          .po-cal-grid { grid-auto-rows: minmax(64px, 1fr); }
          .po-cal-items { display: none; }
          .po-cal-count { position: static; background: var(--po-brand-soft); border-radius: 8px; padding: 1px 6px; align-self: flex-start; }
        }
      `}</style>
    </>
  );
}

function ApptRow({ b }: { b: AdminBooking }) {
  return (
    <Link href={`/admin/bookings?open=${encodeURIComponent(b.id)}`} className="po-appt">
      <Avatar name={b.name} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="po-cell-main po-clamp-1">{b.name}</div>
        <div className="po-cell-sub" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><Clock size={12} />{b.time || "Any time"}</span>
          <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}><Stethoscope size={12} />{b.dept || "No department"}</span>
        </div>
      </div>
      <StatusBadge status={b.status} />
    </Link>
  );
}
