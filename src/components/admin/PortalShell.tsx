"use client";

import "@/styles/admin.css";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FilePen,
  FilePlus2,
  Home,
  Megaphone,
  LayoutGrid,
  Inbox,
  LogOut,
  Mail,
  MessageSquare,
  Newspaper,
  Plus,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  ShieldX,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData, type ToastKind } from "@/context/AdminDataContext";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { Avatar } from "@/components/admin/ui";
import { adminFont } from "@/app/admin/fonts";
import { can, type Perm } from "@/lib/permissions";

type BadgeKey = "drafts" | "pending" | "comments" | "review" | "notices" | "messages";

interface NavItem {
  href: string;
  icon: typeof LayoutGrid;
  label: string;
  badgeKey?: BadgeKey;
  /** Hidden unless the person has this permission. */
  perm?: Perm;
  /** Shortcuts such as "New post" are never highlighted. */
  neverActive?: boolean;
  /** Match only this exact path, not its children. */
  exact?: boolean;
}

type Nav = { section: string; items: NavItem[] }[];

const ADMIN_NAV: Nav = [
  { section: "Overview", items: [{ href: "/admin", icon: LayoutGrid, label: "Dashboard", exact: true }] },
  {
    section: "Content",
    items: [
      { href: "/admin/posts", icon: Newspaper, label: "News & Blogs", badgeKey: "review", perm: "posts.write" },
      { href: "/admin/posts/new", icon: FilePlus2, label: "New Post", neverActive: true, perm: "posts.write" },
      { href: "/admin/comments", icon: MessageSquare, label: "Comments", badgeKey: "comments", perm: "comments" },
      { href: "/admin/messages", icon: Inbox, label: "Messages", badgeKey: "messages", perm: "messages" },
      { href: "/admin/newsletter", icon: Mail, label: "Newsletter", perm: "newsletter" },
    ],
  },
  {
    section: "Appointments",
    items: [
      { href: "/admin/bookings", icon: ClipboardList, label: "All Bookings", badgeKey: "pending", perm: "bookings" },
      { href: "/admin/calendar", icon: CalendarDays, label: "Calendar", perm: "bookings" },
    ],
  },
  {
    section: "People",
    items: [
      { href: "/admin/employees", icon: UsersRound, label: "Employees", perm: "staff.manage" },
      { href: "/admin/departments", icon: Building2, label: "Departments", perm: "staff.manage" },
      { href: "/admin/ranks", icon: Award, label: "Ranks & positions", perm: "staff.manage" },
    ],
  },
  { section: "Staff", items: [{ href: "/admin/notices", icon: Megaphone, label: "Notice board", badgeKey: "notices" }] },
  { section: "System", items: [{ href: "/admin/settings", icon: SettingsIcon, label: "Settings", perm: "settings" }] },
];

const STAFF_NAV: Nav = [
  {
    section: "Staff area",
    items: [
      { href: "/staff", icon: Home, label: "Home", exact: true },
      { href: "/staff/notices", icon: Megaphone, label: "Notice board", badgeKey: "notices" },
    ],
  },
  {
    section: "My writing",
    items: [
      { href: "/staff/posts", icon: FilePen, label: "My posts", badgeKey: "drafts", perm: "posts.write" },
      { href: "/staff/posts/new", icon: FilePlus2, label: "Write a post", neverActive: true, perm: "posts.write" },
    ],
  },
];

const VARIANT = {
  admin: {
    nav: ADMIN_NAV,
    title: "SECH Portal",
    subtitle: "Administration",
    root: "/admin",
    newPost: "/admin/posts/new",
    crumbs: {
      admin: "Dashboard", posts: "News & Blogs", new: "New post", edit: "Edit post",
      comments: "Comments", bookings: "Bookings", calendar: "Calendar", settings: "Settings",
      notices: "Notice board", newsletter: "Newsletter", messages: "Messages",
      employees: "Employees", departments: "Departments and units", ranks: "Ranks and positions",
    } as Record<string, string>,
  },
  staff: {
    nav: STAFF_NAV,
    title: "SECH Staff",
    subtitle: "St. Elizabeth · Hwidiem",
    root: "/staff",
    newPost: "/staff/posts/new",
    crumbs: { staff: "Home", posts: "My posts", new: "Write a post", edit: "Edit post", notices: "Notice board" } as Record<string, string>,
  },
};

/** Pages that need a permission. The server refuses the data regardless;
 *  this shows a clear message instead of a page full of errors. */
const ROUTE_PERMS: [string, Perm][] = [
  ["/admin/bookings", "bookings"],
  ["/admin/calendar", "bookings"],
  ["/admin/settings", "settings"],
  ["/admin/comments", "comments"],
  ["/admin/newsletter", "newsletter"],
  ["/admin/messages", "messages"],
  ["/admin/employees", "staff.manage"],
  ["/admin/departments", "staff.manage"],
  ["/admin/ranks", "staff.manage"],
  ["/admin/posts", "posts.write"],
  ["/staff/posts", "posts.write"],
];

function permForPath(pathname: string): Perm | null {
  const hit = ROUTE_PERMS.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  return hit ? hit[1] : null;
}

const TOAST_ICON: Record<ToastKind, { icon: typeof CheckCircle2; tone: string }> = {
  success: { icon: CheckCircle2, tone: "po-tone-success" },
  warn: { icon: AlertTriangle, tone: "po-tone-warn" },
  danger: { icon: XCircle, tone: "po-tone-danger" },
};

function crumbsFor(pathname: string, labels: Record<string, string>) {
  const out: { href: string; label: string }[] = [];
  let href = "";
  for (const part of pathname.split("/").filter(Boolean)) {
    href += `/${part}`;
    if (/^\d+$/.test(part)) continue; // ids — "Edit post" follows
    out.push({ href, label: labels[part] ?? part });
  }
  return out;
}

/**
 * The chrome shared by the admin console and the staff area: sidebar, top bar,
 * page transitions, unsaved-changes guard and toasts. What differs — the
 * navigation, search and notifications — comes from the variant and from the
 * person's permissions. The server enforces those permissions independently.
 */
export function PortalShell({ variant, children }: { variant: "admin" | "staff"; children: React.ReactNode }) {
  const cfg = VARIANT[variant];
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { admin, loading, logout } = useAuth();
  const {
    theme, sidebarCollapsed, toggleSidebar, posts, bookings, pendingComments, newMessages,
    requestLeave, guardTarget, confirmLeave, cancelLeave, poppingToast, notices,
  } = useAdminData();

  const perms = admin?.perms ?? [];
  const isAdmin = variant === "admin";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // Theme on <html> so fixed overlays are themed too.
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-admin-theme", theme);
    return () => el.removeAttribute("data-admin-theme");
  }, [theme]);

  // ⌘K / Ctrl+K anywhere; "/" when not typing. Admin console only.
  useEffect(() => {
    if (!isAdmin) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      const t = e.target as HTMLElement | null;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAdmin]);

  const navigate = useCallback(
    (href: string) => { if (requestLeave(href)) router.push(href); },
    [requestLeave, router],
  );
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // Also blocks the admin shell from flashing for staff while the auth guard
  // redirects them to /staff.
  if (loading || !admin || (isAdmin && !can(perms, "portal.admin"))) {
    return (
      <div className={adminFont.variable}
        style={{ minHeight: "100vh", background: "linear-gradient(160deg, #073A2D, #041A14)", display: "grid", placeItems: "center" }}>
        <div style={{ display: "grid", placeItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" style={{ width: 56, height: 56, borderRadius: "50%", animation: "po-breathe 1.6s ease-in-out infinite" }} />
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "var(--font-admin), system-ui" }}>Loading the portal…</div>
        </div>
        <style>{`@keyframes po-breathe { 0%,100% { transform: scale(1); opacity: .85 } 50% { transform: scale(1.06); opacity: 1 } }`}</style>
      </div>
    );
  }

  const counts: Record<BadgeKey, number> = {
    // In the staff area the badge counts the person's own drafts.
    drafts: (isAdmin || !admin.id ? posts : posts.filter((p) => p.authorId === admin.id))
      .filter((p) => p.status === "draft").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    comments: pendingComments,
    // Staff submissions waiting for someone who can publish them.
    review: can(perms, "posts.publish") ? posts.filter((p) => p.status === "pending").length : 0,
    notices: notices.filter((n) => !n.isRead).length,
    messages: newMessages,
  };

  const nav = cfg.nav
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(perms, i.perm)) }))
    .filter((g) => g.items.length > 0);

  const onNavClick = (href: string) => (e: React.MouseEvent) => {
    if (!requestLeave(href)) e.preventDefault();
  };
  const handleDiscard = () => {
    const target = confirmLeave();
    if (target) router.push(target);
  };

  const crumbs = crumbsFor(pathname, cfg.crumbs);
  const needed = permForPath(pathname);
  const blocked = needed !== null && !can(perms, needed);
  const newPostAllowed = can(perms, "posts.write");

  return (
    <div className={`po-root ${adminFont.variable}`}>
      <div className="po-shell" data-collapsed={sidebarCollapsed}
        style={{ ["--po-side-w" as string]: sidebarCollapsed ? "76px" : "252px" }}>
        {/* ── Sidebar ── */}
        <aside className="po-sidebar" aria-label={isAdmin ? "Admin navigation" : "Staff navigation"}>
          <div className="po-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="St. Elizabeth Catholic Hospital" />
            {!sidebarCollapsed && (
              <div style={{ minWidth: 0 }}>
                <div className="po-brand-name">{cfg.title}</div>
                <div className="po-brand-sub">{cfg.subtitle}</div>
              </div>
            )}
            <button type="button" className="po-collapse-btn" onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {isAdmin && (
            <button type="button" className="po-side-search" onClick={() => setPaletteOpen(true)} data-tip="Search  ⌘K">
              <Search size={15} />
              {!sidebarCollapsed && (<>Quick search<span className="po-kbd">⌘K</span></>)}
            </button>
          )}

          <nav className="po-nav">
            {nav.map((group) => (
              <div key={group.section}>
                {!sidebarCollapsed ? <div className="po-nav-section">{group.section}</div> : <div style={{ height: 10 }} />}
                {group.items.map((item) => {
                  const active = item.neverActive
                    ? false
                    : item.exact
                      ? pathname === item.href
                      : pathname === item.href ||
                        (pathname.startsWith(item.href + "/") && !pathname.endsWith("/new"));
                  const badge = item.badgeKey ? counts[item.badgeKey] : 0;
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={onNavClick(item.href)} className="po-nav-item"
                      data-active={active} data-tip={sidebarCollapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}>
                      {active && (
                        <motion.span layoutId={`po-nav-pill-${variant}`} className="po-nav-pill"
                          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />
                      )}
                      <Icon size={18} strokeWidth={active ? 2.3 : 2} />
                      {!sidebarCollapsed && <span className="po-nav-label">{item.label}</span>}
                      {badge > 0 && (sidebarCollapsed
                        ? <span className="po-nav-badge po-nav-badge--dot" aria-label={`${badge} waiting`} />
                        : <span className="po-nav-badge">{badge > 99 ? "99+" : badge}</span>)}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="po-side-foot">
            {/* Cross-links between the two areas, for people who can use both. */}
            {isAdmin ? (
              <Link href="/staff" className="po-side-link" data-tip={sidebarCollapsed ? "Staff area" : undefined}>
                <UsersRound size={15} />{!sidebarCollapsed && "Staff area"}
              </Link>
            ) : can(perms, "portal.admin") ? (
              <Link href="/admin" className="po-side-link" data-tip={sidebarCollapsed ? "Admin console" : undefined}>
                <ShieldCheck size={15} />{!sidebarCollapsed && "Admin console"}
              </Link>
            ) : null}
            <Link href="/" className="po-side-link" data-tip={sidebarCollapsed ? "View website" : undefined} target="_blank">
              <ExternalLink size={15} />{!sidebarCollapsed && "View website"}
            </Link>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginTop: 8,
              padding: sidebarCollapsed ? "8px 0" : "10px", borderRadius: 10, background: "rgba(255,255,255,0.05)",
              justifyContent: sidebarCollapsed ? "center" : "flex-start", flexDirection: sidebarCollapsed ? "column" : "row",
            }}>
              <Avatar name={admin.name} size="sm" />
              {!sidebarCollapsed && (
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{admin.name}</div>
                  <div style={{ color: "var(--po-side-text-dim)", fontSize: 11 }}>{admin.role}</div>
                </div>
              )}
              <button type="button" onClick={logout} aria-label="Sign out" data-tip={sidebarCollapsed ? "Sign out" : undefined} title="Sign out"
                style={{ width: 30, height: 30, borderRadius: 8, border: 0, background: "rgba(248,113,113,0.12)", color: "#FCA5A5", display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main column ── */}
        <div className="po-main">
          <header className="po-topbar">
            <nav className="po-crumbs" aria-label="Breadcrumb">
              {crumbs.map((c, i) => i === crumbs.length - 1 ? (
                <span key={c.href} aria-current="page">{c.label}</span>
              ) : (
                <span key={c.href} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Link href={c.href} onClick={onNavClick(c.href)}>{c.label}</Link>
                  <ChevronRight size={13} />
                </span>
              ))}
            </nav>

            {isAdmin ? (
              <button type="button" className="po-topbar-search" onClick={() => setPaletteOpen(true)} aria-label="Search">
                <Search size={15} />
                <span className="po-search-label">Search patients, posts, pages…</span>
                <span className="po-kbd">⌘K</span>
              </button>
            ) : (
              <span style={{ marginLeft: "auto" }} />
            )}

            <div className="po-topbar-actions">
              {newPostAllowed && (
                <Link href={cfg.newPost} onClick={onNavClick(cfg.newPost)} className="po-btn po-btn--primary" aria-label="New post">
                  <Plus size={16} strokeWidth={2.5} />
                  <span className="po-search-label">{isAdmin ? "New post" : "Write a post"}</span>
                </Link>
              )}
              {isAdmin && <NotificationBell />}
              <ThemeToggle />
            </div>
          </header>

          <div className="po-scroll" ref={scrollRef}>
            <motion.main key={pathname} className="po-page"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}>
              {blocked ? (
                <section className="po-card">
                  <div className="po-empty">
                    <div className="po-empty-icon"><ShieldX size={24} strokeWidth={1.8} /></div>
                    <div className="po-empty-title">You don’t have access to this page</div>
                    <div className="po-empty-text">Your account ({admin.role}) can’t open this section. If you need it, ask an administrator.</div>
                    <div style={{ marginTop: 10 }}>
                      <Link href={cfg.root} className="po-btn">Go to {isAdmin ? "the dashboard" : "staff home"}</Link>
                    </div>
                  </div>
                </section>
              ) : children}
            </motion.main>
          </div>
        </div>
      </div>

      {isAdmin && <CommandPalette open={paletteOpen} onClose={closePalette} navigate={navigate} />}

      {/* ── Unsaved-changes guard ── */}
      <AnimatePresence>
        {guardTarget && (
          <motion.div className="po-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: "none" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) cancelLeave(); }}>
            <motion.div className="po-modal" role="alertdialog" aria-modal="true" aria-labelledby="po-guard-title"
              initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
              <div className="po-kpi-icon po-tone-warn" style={{ marginBottom: 14 }}><AlertTriangle size={18} /></div>
              <h3 className="po-modal-title" id="po-guard-title">Discard unsaved changes?</h3>
              <p className="po-modal-text">You have unsaved edits to this post. Leaving now will discard them.</p>
              <div className="po-modal-actions">
                <button type="button" className="po-btn" onClick={cancelLeave} autoFocus>Keep editing</button>
                <button type="button" className="po-btn po-btn--danger" onClick={handleDiscard}>Discard changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <div className="po-toast-stack" aria-live="polite">
        <AnimatePresence>
          {poppingToast && (() => {
            const { icon: Icon, tone } = TOAST_ICON[poppingToast.kind];
            return (
              <motion.div key={poppingToast.id} className="po-toast"
                initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 24 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}>
                <span className={`po-toast-icon ${tone}`} style={{ background: "var(--tone-soft)", color: "var(--tone)" }}><Icon size={15} /></span>
                {poppingToast.msg}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
