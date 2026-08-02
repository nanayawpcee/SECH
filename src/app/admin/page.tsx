"use client";

import Link from "next/link";
import { useAdminData } from "@/context/AdminDataContext";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

const WEEK_BARS = [9, 12, 14, 13];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#FEF3C7", color: "#d97706" },
  confirmed: { bg: "#DCFCE7", color: "#16a34a" },
  cancelled: { bg: "#FEE2E2", color: "#DC2626" },
  published: { bg: "#DCFCE7", color: "#16a34a" },
  draft: { bg: "#F3F4F6", color: "#666" },
};

export default function AdminPage() {
  const { posts, bookings } = useAdminData();

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  const metrics = [
    { label: "Total Bookings", value: String(bookings.length + 241), delta: "+12% this month", color: "#16a34a" },
    { label: "Pending Review", value: String(pendingCount), delta: "Awaiting confirmation", color: "#d97706" },
    { label: "Published Posts", value: String(publishedCount), delta: "2 this week", color: "#16a34a" },
    { label: "Draft Posts", value: String(draftCount), delta: "In progress", color: "#93A29B" },
  ];

  const recentBookings = bookings.slice(0, 4);
  const recentPosts = posts.slice(0, 4);
  const maxBar = Math.max(...WEEK_BARS);

  return (
    <>
      {/* Topbar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "0.5px solid #e5e7eb",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>Dashboard Overview</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/admin/posts/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              background: "#0A4F3C",
              color: "#fff",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            + New Post
          </Link>
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ background: "#F0F7F4", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: "#6B8F82", marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#111" }}>{m.value}</div>
              <div style={{ fontSize: 11, marginTop: 3, color: m.color }}>{m.delta}</div>
            </div>
          ))}
        </div>

        {/* Two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Recent bookings */}
          <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12 }}>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "0.5px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Recent Bookings</span>
              <Link href="/admin/bookings" style={{ fontSize: 12, color: "#0A4F3C", textDecoration: "none" }}>
                View all →
              </Link>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #e5e7eb" }}>
                  {["Patient", "Dept", "Date", "Status"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#888", fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ fontWeight: 500, color: "#111" }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>{b.phone}</div>
                    </td>
                    <td style={{ padding: "9px 12px", fontSize: 12, color: "#555" }}>{b.dept}</td>
                    <td style={{ padding: "9px 12px", fontSize: 12, color: "#555" }}>{b.date}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Recent posts */}
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12 }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "0.5px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Recent Posts</span>
                <Link href="/admin/posts" style={{ fontSize: 12, color: "#0A4F3C", textDecoration: "none" }}>
                  View all →
                </Link>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <tbody>
                  {recentPosts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "0.5px solid #f3f4f6" }}>
                      <td style={{ padding: "9px 12px", maxWidth: 180 }}>
                        <div
                          style={{
                            fontWeight: 500,
                            color: "#111",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.title}
                        </div>
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mini bar chart */}
            <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4 }}>Bookings this month</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: "#111", marginBottom: 10 }}>
                48 <span style={{ fontSize: 13, color: "#888", fontWeight: 400 }}>appointments</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 44 }}>
                {WEEK_BARS.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: "#0A4F3C",
                      borderRadius: "2px 2px 0 0",
                      opacity: 0.7,
                      height: `${Math.round((v / maxBar) * 100)}%`,
                    }}
                    title={`${v} bookings`}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#bbb", marginTop: 3 }}>
                {["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: "#F3F4F6", color: "#666" };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        background: s.bg,
        color: s.color,
      }}
    >
      {status}
    </span>
  );
}
