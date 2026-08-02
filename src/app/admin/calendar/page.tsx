"use client";

import { useState } from "react";
import { useAdminData } from "@/context/AdminDataContext";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import type { AdminBooking } from "@/lib/wp-bookings";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Group by day-of-month using the raw YYYY-MM-DD, restricted to the month on
 * screen. Parsing the localised display string would break as soon as the
 * format changed.
 */
function groupByDay(bookings: AdminBooking[], year: number, month: number) {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  const map: Record<number, AdminBooking[]> = {};
  bookings.forEach((b) => {
    if (!b.preferredDateISO?.startsWith(prefix)) return;
    const day = Number(b.preferredDateISO.slice(8, 10));
    if (!Number.isFinite(day) || day < 1) return;
    map[day] = map[day] ?? [];
    map[day].push(b);
  });
  return map;
}

const STATUS_DOT: Record<string, string> = {
  pending: "#d97706",
  confirmed: "#16a34a",
  cancelled: "#DC2626",
};

export default function CalendarPage() {
  const { bookings, bookingsLoading, bookingsError } = useAdminData();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const byDay = groupByDay(bookings, year, month);
  const selectedBookings = selectedDay ? (byDay[selectedDay] ?? []) : [];

  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const step = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDay(null);
  };

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>
          Calendar — {MONTHS[month]} {year}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => step(-1)} style={{ padding: "6px 12px", border: "0.5px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: "#555" }}>
            ‹ Prev
          </button>
          <button onClick={() => step(1)} style={{ padding: "6px 12px", border: "0.5px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, color: "#555" }}>
            Next ›
          </button>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }}>
          {/* Calendar grid */}
          <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: "#F9FAFB", borderBottom: "0.5px solid #e5e7eb" }}>
              {DAYS.map((d) => (
                <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div>
              {Array.from({ length: cells.length / 7 }, (_, week) => (
                <div
                  key={week}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7,1fr)",
                    borderBottom: week < cells.length / 7 - 1 ? "0.5px solid #f3f4f6" : "none",
                  }}
                >
                  {cells.slice(week * 7, week * 7 + 7).map((day, col) => {
                    const dayBookings = day ? (byDay[day] ?? []) : [];
                    const isSelected = day === selectedDay;
                    const isToday = isCurrentMonth && day === today.getDate();

                    return (
                      <div
                        key={col}
                        onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                        style={{
                          minHeight: 80,
                          padding: 6,
                          borderRight: col < 6 ? "0.5px solid #f3f4f6" : "none",
                          background: isSelected ? "#F0F7F4" : day ? "#fff" : "#FAFAFA",
                          cursor: day ? "pointer" : "default",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (day && !isSelected) (e.currentTarget as HTMLElement).style.background = "#F7FAF8";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = day ? "#fff" : "#FAFAFA";
                        }}
                      >
                        {day && (
                          <>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: isToday ? 700 : dayBookings.length ? 600 : 400,
                                color: isSelected ? "#0A4F3C" : isToday ? "#fff" : dayBookings.length ? "#0A4F3C" : "#999",
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: isToday ? "#0A4F3C" : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 4,
                              }}
                            >
                              {day}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              {dayBookings.slice(0, 2).map((b) => (
                                <div
                                  key={b.id}
                                  style={{
                                    background: "#0A4F3C",
                                    color: "#fff",
                                    fontSize: 9,
                                    borderRadius: 3,
                                    padding: "2px 5px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_DOT[b.status], flexShrink: 0 }} />
                                  {b.name.split(" ")[0]}
                                </div>
                              ))}
                              {dayBookings.length > 2 && (
                                <div style={{ fontSize: 9, color: "#0A4F3C", fontWeight: 600, paddingLeft: 4 }}>
                                  +{dayBookings.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div style={{ position: "sticky", top: 20 }}>
            {/* Legend */}
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Legend</div>
              {[
                { color: STATUS_DOT.pending, label: "Pending" },
                { color: STATUS_DOT.confirmed, label: "Confirmed" },
                { color: STATUS_DOT.cancelled, label: "Cancelled" },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 12, color: "#555" }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>

            {/* Selected day detail */}
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #e5e7eb", background: selectedDay ? "#0A4F3C" : "#F9FAFB" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedDay ? "#fff" : "#aaa" }}>
                  {selectedDay ? `${MONTHS[month]} ${selectedDay}, ${year}` : "Select a day"}
                </div>
                {selectedDay && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                    {selectedBookings.length} appointment{selectedBookings.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
              {selectedDay && selectedBookings.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#bbb", fontSize: 13 }}>No bookings this day</div>
              )}
              {selectedBookings.map((b) => (
                <div key={b.id} style={{ padding: "12px 14px", borderBottom: "0.5px solid #f3f4f6" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{b.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_DOT[b.status] }} />
                      <span style={{ fontSize: 11, color: "#888" }}>{b.time}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>{b.dept}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>{b.phone}</div>
                </div>
              ))}
              {!selectedDay && <div style={{ padding: 20, textAlign: "center", color: "#ddd", fontSize: 28 }}>📅</div>}
            </div>

            {/* Monthly summary */}
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{MONTHS[month]} Summary</div>
              {[
                { label: "Total bookings", value: bookings.length },
                { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length },
                { label: "Pending", value: bookings.filter((b) => b.status === "pending").length },
                { label: "Cancelled", value: bookings.filter((b) => b.status === "cancelled").length },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "0.5px solid #f3f4f6", fontSize: 12 }}>
                  <span style={{ color: "#666" }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: "#111" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
