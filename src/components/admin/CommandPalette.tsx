"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  CornerDownLeft,
  FilePlus2,
  FileText,
  Globe,
  Inbox,
  LayoutGrid,
  Mail,
  Megaphone,
  MessageSquare,
  Moon,
  Newspaper,
  RefreshCw,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { useAuth } from "@/context/AuthContext";
import { can, type Perm } from "@/lib/permissions";

interface Command {
  id: string;
  /** Hidden unless the person has this permission. */
  perm?: Perm;
  group: "Pages" | "Actions" | "Posts" | "Bookings";
  title: string;
  sub?: string;
  icon: LucideIcon;
  keywords?: string;
  run: () => void;
}

/** Every term must appear somewhere; order does not matter. */
function matches(cmd: Command, query: string) {
  if (!query) return true;
  const hay = `${cmd.title} ${cmd.sub ?? ""} ${cmd.keywords ?? ""}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
}

export function CommandPalette({
  open,
  onClose,
  navigate,
}: {
  open: boolean;
  onClose: () => void;
  /** Routes through the layout's unsaved-changes guard. */
  navigate: (href: string) => void;
}) {
  const { posts, bookings, theme, toggleTheme, refreshPosts, refreshBookings, addToast } = useAdminData();
  const { admin } = useAuth();
  const perms = admin?.perms;
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // After the enter animation has mounted the input.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => { onClose(); navigate(href); };
    const pages: Command[] = [
      { id: "p-dash", group: "Pages", title: "Dashboard", icon: LayoutGrid, keywords: "home overview", run: go("/admin") },
      { id: "p-posts", group: "Pages", title: "News & Blogs", perm: "posts.write", icon: Newspaper, keywords: "posts articles", run: go("/admin/posts") },
      { id: "p-comments", group: "Pages", title: "Comments", perm: "comments", icon: MessageSquare, keywords: "moderation approve", run: go("/admin/comments") },
      { id: "p-employees", group: "Pages", title: "Employees", perm: "staff.manage", icon: UserRound, keywords: "staff records nurses hr personnel", run: go("/admin/employees") },
      { id: "p-departments", group: "Pages", title: "Departments and units", perm: "staff.manage", icon: LayoutGrid, keywords: "wards units in-charge", run: go("/admin/departments") },
      { id: "p-ranks", group: "Pages", title: "Ranks and positions", perm: "staff.manage", icon: FileText, keywords: "grades cadres scheme of service", run: go("/admin/ranks") },
      { id: "p-messages", group: "Pages", title: "Messages", perm: "messages", icon: Inbox, keywords: "contact inbox enquiries complaints", run: go("/admin/messages") },
      { id: "p-newsletter", group: "Pages", title: "Newsletter", perm: "newsletter", icon: Mail, keywords: "subscribers mailing list email", run: go("/admin/newsletter") },
      { id: "p-bookings", group: "Pages", title: "All Bookings", perm: "bookings", icon: ClipboardList, keywords: "appointments patients", run: go("/admin/bookings") },
      { id: "p-cal", group: "Pages", title: "Calendar", perm: "bookings", icon: CalendarDays, keywords: "schedule appointments", run: go("/admin/calendar") },
      { id: "p-notices", group: "Pages", title: "Notice board", icon: Megaphone, keywords: "announcements memo staff", run: go("/admin/notices") },
      { id: "p-settings", group: "Pages", title: "Settings", perm: "settings", icon: Settings, keywords: "hospital profile departments admins", run: go("/admin/settings") },
    ];
    const actions: Command[] = [
      { id: "a-new", group: "Actions", title: "Write a new post", perm: "posts.write", icon: FilePlus2, keywords: "create add article", run: go("/admin/posts/new") },
      {
        id: "a-theme", group: "Actions",
        title: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        icon: theme === "dark" ? Sun : Moon, keywords: "theme appearance",
        run: () => { toggleTheme(); onClose(); },
      },
      {
        id: "a-refresh", group: "Actions", title: "Refresh all data", icon: RefreshCw, keywords: "reload sync",
        run: () => {
          onClose();
          Promise.all([
            can(perms, "posts.write") ? refreshPosts() : null,
            can(perms, "bookings") ? refreshBookings() : null,
          ]).then(() => addToast("Data refreshed"));
        },
      },
      {
        id: "a-site", group: "Actions", title: "Open the public website", icon: Globe, keywords: "view site",
        run: () => { onClose(); window.open("/", "_blank", "noopener"); },
      },
    ];
    const postCmds: Command[] = posts.map((p) => ({
      id: `post-${p.id}`,
      group: "Posts",
      title: p.title,
      sub: `${p.status} · ${p.type}${p.date ? ` · ${p.date}` : ""}`,
      icon: FileText,
      keywords: p.slug,
      run: go(`/admin/posts/${p.id}/edit`),
    }));
    const bookingCmds: Command[] = bookings.map((b) => ({
      id: `bk-${b.databaseId}`,
      group: "Bookings",
      perm: "bookings" as const,
      title: b.name,
      sub: `${b.id} · ${b.dept || "No department"} · ${b.date || "No date"} · ${b.status}`,
      icon: UserRound,
      keywords: `${b.phone} ${b.email}`,
      run: go(`/admin/bookings?open=${encodeURIComponent(b.id)}`),
    }));
    return [...pages, ...actions, ...postCmds, ...bookingCmds].filter((c) => !c.perm || can(perms, c.perm));
  }, [posts, bookings, theme, toggleTheme, refreshPosts, refreshBookings, addToast, navigate, onClose, perms]);

  // With no query, show pages and actions only — the full post and booking
  // lists would bury them. Typing searches everything, capped per group.
  const results = useMemo(() => {
    const q = query.trim();
    const pool = q ? commands : commands.filter((c) => c.group === "Pages" || c.group === "Actions");
    const hits = pool.filter((c) => matches(c, q));
    const perGroup: Record<string, number> = {};
    return hits.filter((c) => (perGroup[c.group] = (perGroup[c.group] ?? 0) + 1) <= 6);
  }, [commands, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ad-overlay ad-cmdk-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 , pointerEvents: "none" }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="ad-cmdk"
            role="dialog"
            aria-modal="true"
            aria-label="Search and commands"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="ad-cmdk-input-row">
              <Search size={18} />
              <input
                ref={inputRef}
                className="ad-cmdk-input"
                placeholder="Search pages, posts, patients, or type a command…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                role="combobox"
                aria-expanded="true"
                aria-controls="ad-cmdk-list"
                aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
              />
              <span className="ad-kbd">Esc</span>
            </div>

            <div className="ad-cmdk-list" id="ad-cmdk-list" role="listbox" ref={listRef}>
              {results.length === 0 ? (
                <div className="ad-empty" style={{ padding: "32px 16px" }}>
                  <div className="ad-empty-title">No matches</div>
                  <div className="ad-empty-text">Try a patient name, booking reference or post title.</div>
                </div>
              ) : (
                results.map((cmd, i) => {
                  const header = cmd.group !== lastGroup ? cmd.group : null;
                  lastGroup = cmd.group;
                  const Icon = cmd.icon;
                  return (
                    <div key={cmd.id}>
                      {header && <div className="ad-cmdk-group">{header}</div>}
                      <div
                        id={`cmd-${cmd.id}`}
                        role="option"
                        aria-selected={i === active}
                        data-active={i === active}
                        data-index={i}
                        className="ad-cmdk-item"
                        onMouseMove={() => setActive(i)}
                        onClick={() => cmd.run()}
                      >
                        <span className="ad-cmdk-item-icon"><Icon size={16} /></span>
                        <span className="ad-cmdk-item-text">
                          <span className="ad-cmdk-item-title" style={{ display: "block" }}>{cmd.title}</span>
                          {cmd.sub && <span className="ad-cmdk-item-sub" style={{ display: "block" }}>{cmd.sub}</span>}
                        </span>
                        {i === active && <CornerDownLeft size={15} style={{ color: "var(--ad-text-3)" }} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="ad-cmdk-foot">
              <span><span className="ad-kbd">↑</span><span className="ad-kbd">↓</span> Navigate</span>
              <span><span className="ad-kbd">Enter</span> Open</span>
              <span style={{ marginLeft: "auto" }}><span className="ad-kbd">⌘</span><span className="ad-kbd">K</span> Toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
