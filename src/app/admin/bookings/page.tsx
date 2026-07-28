"use client";

import { useState } from "react";
import { useAdminData } from "@/context/AdminDataContext";
import { NotificationBell } from "@/components/admin/NotificationBell";
import type { Booking } from "@/app/admin/data";

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#FEF3C7", color: "#d97706" },
  confirmed: { bg: "#DCFCE7", color: "#16a34a" },
  cancelled: { bg: "#FEE2E2", color: "#DC2626" },
};

const TYPE_LABEL: Record<string, string> = {
  consultation: "New Consult",
  followup: "Follow-Up",
  test: "Test / Lab",
};

function Badge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "#F3F4F6", color: "#666" };
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

function Modal({
  booking,
  onClose,
  onConfirm,
}: {
  booking: Booking;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,51,40,0.45)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ background: "#0A4F3C", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#E8B84B", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 3 }}>
              Booking Detail
            </div>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{booking.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              width: 30,
              height: 30,
              borderRadius: "50%",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
            {[
              ["Booking ID", booking.id],
              ["Status", booking.status],
              ["Phone", booking.phone],
              ["Email", booking.email || "—"],
              ["Department", booking.dept],
              ["Type", TYPE_LABEL[booking.type]],
              ["Date", booking.date],
              ["Time", booking.time],
              ["Insurance", booking.insurance],
              ["Submitted", booking.createdAt],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, color: "#111" }}>
                  {label === "Status" ? <Badge status={val} /> : val}
                </div>
              </div>
            ))}
          </div>
          {booking.notes && (
            <div style={{ marginTop: 14, background: "#F7F9F7", borderRadius: 6, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Notes
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>{booking.notes}</div>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "0.5px solid #e5e7eb", display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: 9, border: "0.5px solid #d1d5db", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 13, color: "#555" }}
          >
            Close
          </button>
          {booking.status === "pending" && (
            <button
              onClick={onConfirm}
              style={{ flex: 1, padding: 9, background: "#0A4F3C", border: "none", borderRadius: 7, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              ✓ Confirm Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { bookings, confirmBooking, cancelBooking, addToast } = useAdminData();
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  const depts = ["all", ...Array.from(new Set(bookings.map((b) => b.dept)))];

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const matchDept = deptFilter === "all" || b.dept === deptFilter;
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.dept.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchDept && matchSearch;
  });

  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const exportCSV = () => {
    const headers = ["ID", "Name", "Phone", "Email", "Department", "Type", "Date", "Time", "Insurance", "Status"];
    const rows = filtered.map((b) => [b.id, b.name, b.phone, b.email, b.dept, b.type, b.date, b.time, b.insurance, b.status]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sech-bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
    addToast("CSV exported");
  };

  return (
    <>
      {/* Topbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>All Bookings</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 9, fontSize: 14, color: "#bbb", pointerEvents: "none" }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Patient, dept, ID…"
              style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: 13, border: "0.5px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#111", width: 200, outline: "none" }}
            />
          </div>
          <button
            onClick={exportCSV}
            style={{ padding: "7px 14px", border: "0.5px solid #d1d5db", borderRadius: 6, fontSize: 13, background: "#fff", color: "#555", cursor: "pointer" }}
          >
            Export CSV
          </button>
          <NotificationBell />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Pending", value: counts.pending, bg: "#FEF3C7", color: "#d97706" },
            { label: "Confirmed today", value: counts.confirmed, bg: "#DCFCE7", color: "#16a34a" },
            { label: "Cancelled", value: counts.cancelled, bg: "#FEE2E2", color: "#DC2626" },
          ].map((card) => (
            <div key={card.label} style={{ background: card.bg, borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: card.color, fontWeight: 600, marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #e5e7eb", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {/* Status chips */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase" }}>Status</span>
              {["all", "pending", "confirmed", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "0.5px solid",
                    background: statusFilter === s ? "#0A4F3C" : "#fff",
                    color: statusFilter === s ? "#fff" : "#666",
                    borderColor: statusFilter === s ? "#0A4F3C" : "#d1d5db",
                    transition: "all 0.15s",
                  }}
                >
                  {s === "all" ? `All (${bookings.length})` : s}
                </button>
              ))}
            </div>

            {/* Dept select */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto" }}>
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase" }}>Dept</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{ fontSize: 12, border: "0.5px solid #d1d5db", borderRadius: 6, padding: "5px 8px", background: "#fff", color: "#555", outline: "none" }}
              >
                {depts.map((d) => (
                  <option key={d} value={d}>
                    {d === "all" ? "All departments" : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #e5e7eb", background: "#F9FAFB" }}>
                  {["ID", "Patient", "Department", "Type", "Date", "Time", "Insurance", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#bbb", fontSize: 13 }}>
                      No bookings match your filters
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr
                      key={b.id}
                      style={{ borderBottom: "0.5px solid #f3f4f6" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#F9FAFB")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#fff")}
                    >
                      <td style={{ padding: "10px 12px", fontSize: 11, color: "#aaa", fontFamily: "monospace" }}>{b.id}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 600, color: "#111" }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{b.phone}</div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#555" }}>{b.dept}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#777" }}>{TYPE_LABEL[b.type]}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>{b.date}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#555" }}>{b.time}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "#777" }}>{b.insurance}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <Badge status={b.status} />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => setSelectedId(b.id)}
                            style={{ padding: "4px 8px", border: "0.5px solid #d1d5db", borderRadius: 5, fontSize: 12, background: "#fff", cursor: "pointer", color: "#555" }}
                          >
                            View
                          </button>
                          {b.status === "pending" && (
                            <button
                              onClick={() => confirmBooking(b.id)}
                              style={{ padding: "4px 8px", border: "0.5px solid #86EFAC", borderRadius: 5, fontSize: 12, background: "#DCFCE7", cursor: "pointer", color: "#16a34a", fontWeight: 600 }}
                            >
                              ✓
                            </button>
                          )}
                          {b.status !== "cancelled" && (
                            <button
                              onClick={() => cancelBooking(b.id)}
                              style={{ padding: "4px 8px", border: "0.5px solid #FCA5A5", borderRadius: 5, fontSize: 12, background: "#fff", cursor: "pointer", color: "#DC2626" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: "0.5px solid #e5e7eb", fontSize: 12, color: "#aaa" }}>
            Showing {filtered.length} of {bookings.length} bookings
          </div>
        </div>
      </div>

      {selected && (
        <Modal
          booking={selected}
          onClose={() => setSelectedId(null)}
          onConfirm={() => {
            confirmBooking(selected.id);
            setSelectedId(null);
          }}
        />
      )}
    </>
  );
}
