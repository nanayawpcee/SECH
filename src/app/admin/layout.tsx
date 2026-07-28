"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Newspaper,
  FilePlus2,
  ClipboardList,
  CalendarDays,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AdminDataProvider, useAdminData, toastDotColor } from "@/context/AdminDataContext";

interface NavItem {
  href: string;
  icon: typeof LayoutGrid;
  label: string;
  badgeKey?: "drafts" | "pending";
  /** "New Post" is an action shortcut, not a nav destination — the design
   *  never highlights it, even while its own route is open. */
  neverActive?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ href: "/admin", icon: LayoutGrid, label: "Dashboard" }],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/posts", icon: Newspaper, label: "News & Blogs", badgeKey: "drafts" },
      { href: "/admin/posts/new", icon: FilePlus2, label: "New Post", neverActive: true },
    ],
  },
  {
    section: "Appointments",
    items: [
      { href: "/admin/bookings", icon: ClipboardList, label: "All Bookings", badgeKey: "pending" },
      { href: "/admin/calendar", icon: CalendarDays, label: "Calendar View" },
    ],
  },
  {
    section: "Settings",
    items: [{ href: "/admin/settings", icon: SettingsIcon, label: "Settings" }],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminDataProvider>
      <AdminShell>{children}</AdminShell>
    </AdminDataProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, logout } = useAuth();
  const {
    sidebarCollapsed,
    toggleSidebar,
    posts,
    bookings,
    requestLeave,
    guardTarget,
    confirmLeave,
    cancelLeave,
    poppingToast,
  } = useAdminData();

  const isLoginPage = pathname === "/admin/login";
  if (isLoginPage) return <>{children}</>;

  if (loading || !admin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#063328",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "3px solid rgba(255,255,255,0.2)",
            borderTopColor: "#E8B84B",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  const draftCount = posts.filter((p) => p.status === "draft").length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const badgeValue = (key?: "drafts" | "pending") =>
    key === "drafts" ? draftCount : key === "pending" ? pendingCount : 0;

  const sidebarWidth = sidebarCollapsed ? 68 : 232;

  const handleNavClick = (href: string) => (e: React.MouseEvent) => {
    if (!requestLeave(href)) e.preventDefault();
  };

  const handleDiscard = () => {
    const target = confirmLeave();
    if (target) router.push(target);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${sidebarWidth}px 1fr`,
        minHeight: "100vh",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        transition: "grid-template-columns 0.18s ease",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          background: "#fff",
          borderRight: "0.5px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: sidebarCollapsed ? "16px 0" : "16px",
            borderBottom: "0.5px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
            gap: 10,
            flexShrink: 0,
          }}
        >
          {!sidebarCollapsed && (
            <>
              <img src="/images/logo.png" alt="Logo" style={{ width: 32, height: 32, flexShrink: 0 }} />
              <div style={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>
                  SECH Admin
                </div>
                <div style={{ fontSize: 10.5, color: "#aaa" }}>Hospital Portal</div>
              </div>
            </>
          )}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              marginLeft: sidebarCollapsed ? 0 : "auto",
              width: 22,
              height: 22,
              borderRadius: 6,
              border: "none",
              background: "#F3F4F6",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#666",
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ padding: "8px 0", flex: 1, overflowY: "auto" }}>
          {NAV.map((group) => (
            <div key={group.section}>
              {!sidebarCollapsed && (
                <div
                  style={{
                    padding: "10px 14px 3px",
                    fontSize: 10,
                    color: "#bbb",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  {group.section}
                </div>
              )}
              {group.items.map((item) => {
                const active = item.neverActive
                  ? false
                  : item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                const badge = badgeValue(item.badgeKey);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick(item.href)}
                    title={sidebarCollapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      margin: "1px 8px",
                      padding: sidebarCollapsed ? "9px" : "8px 10px",
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      borderRadius: 8,
                      fontSize: 13,
                      color: active ? "#0A4F3C" : "#555",
                      background: active ? "#F0F7F4" : "transparent",
                      fontWeight: active ? 600 : 400,
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "#F9FAFB";
                        (e.currentTarget as HTMLElement).style.color = "#111";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                        (e.currentTarget as HTMLElement).style.color = "#555";
                      }
                    }}
                  >
                    <Icon size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                    {!sidebarCollapsed && (
                      <>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.label}
                        </span>
                        {badge > 0 && (
                          <span
                            style={{
                              background: "#FEE2E2",
                              color: "#DC2626",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "1px 7px",
                              borderRadius: 20,
                              flexShrink: 0,
                            }}
                          >
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "#f3f4f6", margin: "0 14px", flexShrink: 0 }} />

        {/* Back to site link */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "flex-start",
            gap: 9,
            padding: "10px 14px",
            fontSize: 12,
            color: "#888",
            textDecoration: "none",
            transition: "color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#0A4F3C")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
          title={sidebarCollapsed ? "Back to website" : undefined}
        >
          <span style={{ fontSize: 14 }}>←</span>
          {!sidebarCollapsed && "Back to website"}
        </Link>

        {/* User card + logout */}
        <div style={{ padding: "12px 14px", borderTop: "0.5px solid #e5e7eb", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
              gap: 9,
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#0A4F3C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#E8B84B",
                flexShrink: 0,
              }}
            >
              {admin.avatar}
            </div>
            {!sidebarCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#111",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {admin.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#aaa",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {admin.role}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            title="Sign out"
            style={{
              width: "100%",
              padding: "7px",
              border: "0.5px solid #e5e7eb",
              borderRadius: 6,
              background: "#fff",
              fontSize: 12,
              color: "#DC2626",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FEF2F2";
              (e.currentTarget as HTMLElement).style.borderColor = "#FCA5A5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#fff";
              (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
            }}
          >
            <LogOut size={13} />
            {!sidebarCollapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ background: "#F7F9F7", overflowY: "auto", minHeight: "100vh" }}>{children}</div>

      {/* ── Unsaved changes guard ── */}
      {guardTarget && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelLeave();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6,51,40,0.45)",
            zIndex: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 380,
              padding: 24,
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              animation: "popIn 0.18s ease",
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 8px" }}>
              Discard unsaved changes?
            </h3>
            <p style={{ fontSize: 13, color: "#7C8B85", margin: "0 0 20px", lineHeight: 1.5 }}>
              You have unsaved edits to this post. Leaving now will discard them.
            </p>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button
                onClick={cancelLeave}
                style={{
                  padding: "8px 15px",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: 7,
                  background: "#fff",
                  fontSize: 13,
                  color: "#4B6B5F",
                  cursor: "pointer",
                }}
              >
                Keep editing
              </button>
              <button
                onClick={handleDiscard}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: 7,
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast popup ── */}
      {poppingToast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#0A4F3C",
            color: "#fff",
            padding: "11px 18px",
            borderRadius: 9,
            fontSize: 13,
            zIndex: 700,
            display: "flex",
            alignItems: "center",
            gap: 9,
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
            animation: "popIn 0.2s ease",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: toastDotColor(poppingToast.kind),
              flexShrink: 0,
            }}
          />
          {poppingToast.msg}
        </div>
      )}

      <style>{`@keyframes popIn { from { opacity:0; transform:translateY(8px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
    </div>
  );
}
