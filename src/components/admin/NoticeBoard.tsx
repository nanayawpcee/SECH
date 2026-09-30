"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Check,
  CheckCheck,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Lock,
  Share2,
  Megaphone,
  PenLine,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import {
  NOTICE_CATEGORIES,
  type NoticeCategory,
  type NoticePriority,
  type StaffNotice,
} from "@/lib/wp-notices";
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Segmented,
  Skeleton,
  Switch,
  type Tone,
  useInitialParam,
} from "@/components/admin/ui";
import { formatDay, todayKey } from "@/lib/admin-dates";

type View = "all" | "unread" | "pinned";

const CATEGORY_TONE: Record<NoticeCategory, Tone> = {
  general: "brand",
  clinical: "info",
  hr: "violet",
  events: "gold",
  facilities: "teal",
};

const PRIORITY: Record<NoticePriority, { label: string; tone: Tone }> = {
  normal: { label: "Normal", tone: "muted" },
  important: { label: "Important", tone: "gold" },
  urgent: { label: "Urgent", tone: "danger" },
};

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} day${Math.floor(s / 86400) === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const categoryLabel = (c: NoticeCategory) => NOTICE_CATEGORIES.find((x) => x.value === c)?.label ?? c;

/**
 * The staff notice board. Everyone signed in reads it; content managers and
 * administrators also post, edit and remove notices. All text is rendered as
 * text — notices are typed by staff, and the plugin stores them as plain text.
 */
export function NoticeBoard() {
  const { admin } = useAuth();
  const {
    notices, noticesLoading, noticesNeedPlugin, refreshNotices,
    markNoticeRead, deleteNotice,
  } = useAdminData();
  const canManage = can(admin?.perms, "notices.manage");

  const [view, setView] = useState<View>("all");
  const [category, setCategory] = useState<"all" | NoticeCategory>("all");
  const [query, setQuery] = useState("");
  const [composer, setComposer] = useState<StaffNotice | "new" | null>(null);
  const [toDelete, setToDelete] = useState<StaffNotice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Arriving from a shared link (?open=ID): bring that notice into view,
  // opened, and count it as read.
  const openParam = useInitialParam("open");
  const openId = openParam ? Number(openParam) : null;
  useEffect(() => {
    if (!openId || noticesLoading) return;
    const target = notices.find((n) => n.databaseId === openId);
    if (!target) return;
    requestAnimationFrame(() =>
      document.getElementById(`notice-${openId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
    if (!target.isRead) markNoticeRead(openId);
    // Once, when the board first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, noticesLoading]);

  const unread = notices.filter((n) => !n.isRead);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notices.filter((n) =>
      (view === "all" || (view === "unread" ? !n.isRead : n.pinned)) &&
      (category === "all" || n.category === category) &&
      (!q || `${n.title} ${n.body} ${n.authorName} ${n.audience ?? ""}`.toLowerCase().includes(q)),
    );
  }, [notices, view, category, query]);

  const refresh = async () => {
    setRefreshing(true);
    await refreshNotices();
    setRefreshing(false);
  };

  const markAll = async () => {
    for (const n of unread) await markNoticeRead(n.databaseId);
  };

  return (
    <>
      <PageHeader
        title="Notice board"
        subtitle={
          noticesLoading ? "Loading notices…"
            : `${notices.length} notice${notices.length === 1 ? "" : "s"}${unread.length ? ` · ${unread.length} unread` : " · all read"}`
        }
        actions={
          <>
            <button type="button" className="ad-btn" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "ad-spin" : ""} />Refresh
            </button>
            {unread.length > 1 && (
              <button type="button" className="ad-btn" onClick={markAll}><CheckCheck size={15} />Mark all read</button>
            )}
            {canManage && !noticesNeedPlugin && notices.length > 0 && (
              <button type="button" className="ad-btn" onClick={() => setShareOpen(true)}>
                <Share2 size={15} />Share today’s notices
              </button>
            )}
            {canManage && !noticesNeedPlugin && (
              <button type="button" className="ad-btn ad-btn--primary" onClick={() => setComposer("new")}>
                <Plus size={16} />Post a notice
              </button>
            )}
          </>
        }
      />

      {noticesNeedPlugin ? (
        <section className="ad-card">
          <EmptyState
            icon={Megaphone}
            title="The notice board isn’t switched on yet"
            text={canManage
              ? "WordPress needs the updated SECH Portal plugin (version 1.1.0). Once it’s installed, notices appear here for all staff."
              : "It will appear here as soon as an administrator finishes setting it up."}
          />
        </section>
      ) : (
        <>
          <section className="ad-card" style={{ marginBottom: 16 }}>
            <div className="ad-toolbar">
              <Segmented<View>
                id="notice-view"
                ariaLabel="Show"
                value={view}
                onChange={setView}
                options={[
                  { value: "all", label: "All", count: notices.length },
                  { value: "unread", label: "Unread", count: unread.length },
                  { value: "pinned", label: <><Pin size={13} />Pinned</> },
                ]}
              />
              <select className="ad-select" style={{ width: 170 }} value={category} onChange={(e) => setCategory(e.target.value as typeof category)} aria-label="Category">
                <option value="all">All categories</option>
                {NOTICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="ad-input-wrap" style={{ flex: "1 1 220px", maxWidth: 340 }}>
                <Search size={15} />
                <input className="ad-input" placeholder="Search notices" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search notices" />
              </div>
            </div>
          </section>

          {noticesLoading ? (
            <div style={{ display: "grid", gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={140} r={14} />)}</div>
          ) : filtered.length === 0 ? (
            <section className="ad-card">
              <EmptyState
                icon={view === "unread" ? CheckCheck : Megaphone}
                title={notices.length === 0 ? "No notices yet" : view === "unread" ? "You’re all caught up" : "No notices match"}
                text={notices.length === 0
                  ? canManage ? "Post the first one: meetings, memos, events, anything staff need to know." : "Announcements from management will appear here."
                  : view === "unread" ? "You’ve read every notice on the board." : "Try a different filter or search."}
                action={notices.length === 0 && canManage
                  ? <button type="button" className="ad-btn ad-btn--primary" onClick={() => setComposer("new")}><Plus size={15} />Post a notice</button>
                  : undefined}
              />
            </section>
          ) : (
            <div className="nb-list">
              <AnimatePresence initial={false}>
                {filtered.map((n, i) => (
                  <NoticeCard
                    key={n.databaseId}
                    notice={n}
                    index={i}
                    focused={n.databaseId === openId}
                    canManage={canManage}
                    onRead={() => markNoticeRead(n.databaseId)}
                    onEdit={() => setComposer(n)}
                    onDelete={() => setToDelete(n)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <NoticeComposer notice={composer} onClose={() => setComposer(null)} />
      <ShareDialog open={shareOpen} notices={notices} onClose={() => setShareOpen(false)} />

      <ConfirmDialog
        open={!!toDelete}
        icon={Trash2}
        title="Remove this notice?"
        text={<>“{toDelete?.title}” will be taken off the board for everyone. It can be restored from the WordPress trash for 30 days.</>}
        confirmLabel="Remove notice"
        onConfirm={async () => { if (toDelete) await deleteNotice(toDelete.databaseId); setToDelete(null); }}
        onCancel={() => setToDelete(null)}
      />

      <style>{NOTICE_CSS}</style>
    </>
  );
}

function NoticeCard({ notice: n, index, focused, canManage, onRead, onEdit, onDelete }: {
  notice: StaffNotice;
  index: number;
  focused?: boolean;
  canManage: boolean;
  onRead: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(!!focused);
  const [copied, setCopied] = useState(false);
  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/notices/${n.databaseId}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }, () => {});
  };
  const long = n.body.length > 280 || n.body.split("\n").length > 5;
  const prio = PRIORITY[n.priority];
  const edited = new Date(n.updatedAt).getTime() - new Date(n.createdAt).getTime() > 60_000;

  const expand = () => {
    setOpen((v) => !v);
    if (!n.isRead) onRead(); // reading it in full counts as read
  };

  return (
    <motion.article
      layout
      id={`notice-${n.databaseId}`}
      data-focused={!!focused}
      className={`ad-card nb-card ad-tone-${n.priority === "normal" ? CATEGORY_TONE[n.category] : prio.tone}`}
      data-unread={!n.isRead}
      data-priority={n.priority}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: Math.min(index, 8) * 0.03 }}
    >
      <div className="nb-top">
        {n.pinned && <span className="nb-pin" title="Pinned"><Pin size={13} />Pinned</span>}
        <span className={`ad-badge ad-badge--plain ad-tone-${CATEGORY_TONE[n.category]}`} style={{ textTransform: "none" }}>{categoryLabel(n.category)}</span>
        {n.priority !== "normal" && (
          <span className={`ad-badge ad-tone-${prio.tone}`} style={{ textTransform: "none" }}>
            {n.priority === "urgent" && <AlertTriangle size={12} />}{prio.label}
          </span>
        )}
        {n.audience && (
          <span className="ad-badge ad-badge--plain ad-tone-muted" style={{ textTransform: "none" }}><UsersRound size={12} />{n.audience}</span>
        )}
        {!n.isRead && <span className="nb-new"><span className="nb-dot" />New</span>}
      </div>

      <h3 className="nb-title">{n.title}</h3>
      <div className="nb-meta">
        {n.authorName} · {timeAgo(n.createdAt)}{edited ? " · edited" : ""}
        {n.expiresOn && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            · <CalendarClock size={12} />Until {formatDay(n.expiresOn, { day: "numeric", month: "short" })}
            {n.expiresOn < todayKey() && <strong style={{ color: "var(--ad-danger)" }}> (expired)</strong>}
          </span>
        )}
      </div>

      {n.body && (
        <p className="nb-body" data-open={open || !long}>{n.body}</p>
      )}
      {long && (
        <button type="button" className="nb-more" onClick={expand}>{open ? "Show less" : "Read more"}</button>
      )}

      <div className="nb-foot">
        {n.link && (
          <a href={n.link} target="_blank" rel="noopener noreferrer" className="ad-btn ad-btn--sm"><ExternalLink size={14} />Open link</a>
        )}
        {n.isRead ? (
          <span className="nb-read"><Check size={14} strokeWidth={2.6} />Read</span>
        ) : (
          <button type="button" className="ad-btn ad-btn--sm ad-btn--success-soft" onClick={onRead}><Check size={14} strokeWidth={2.6} />Mark as read</button>
        )}
        {canManage && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
            <span className="nb-readcount" title={n.publicHeadline === false ? "The title is hidden on the share link" : "The title appears on the share link"}>
              {n.publicHeadline === false ? <Lock size={13} /> : <Globe size={13} />}
              {n.publicHeadline === false ? "Staff-only" : "Public title"}
            </span>
            <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={copyLink} aria-label={`Copy share link for ${n.title}`} title={copied ? "Copied" : "Copy share link"}>
              {copied ? <Check size={15} /> : <Link2 size={15} />}
            </button>
            {n.readCount !== null && (
              <span className="nb-readcount" title="Staff who have marked this as read"><Eye size={13} />Read by {n.readCount}</span>
            )}
            <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={onEdit} aria-label={`Edit ${n.title}`} title="Edit"><PenLine size={15} /></button>
            <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={onDelete} aria-label={`Remove ${n.title}`} title="Remove" style={{ color: "var(--ad-danger)" }}><Trash2 size={15} /></button>
          </div>
        )}
      </div>
    </motion.article>
  );
}

/* ── Composer ─────────────────────────────────────────────────────────── */

const BLANK = {
  title: "", body: "", category: "general" as NoticeCategory, priority: "normal" as NoticePriority,
  pinned: false, expiresOn: "", audience: "", link: "", resetReads: false, publicHeadline: true,
};

function NoticeComposer({ notice, onClose }: { notice: StaffNotice | "new" | null; onClose: () => void }) {
  const { saveNotice } = useAdminData();
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const editing = notice && notice !== "new" ? notice : null;

  useEffect(() => {
    if (!notice) return;
    setForm(editing ? {
      title: editing.title, body: editing.body, category: editing.category, priority: editing.priority,
      pinned: editing.pinned, expiresOn: editing.expiresOn ?? "", audience: editing.audience ?? "",
      link: editing.link ?? "", resetReads: false, publicHeadline: editing.publicHeadline !== false,
    } : BLANK);
    // Departments for the audience list — the public settings, so any manager can load them.
    fetch("/api/settings").then((r) => r.json()).then((d) => setDepartments(d?.settings?.departments ?? [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice]);

  useEffect(() => {
    if (!notice) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notice, saving, onClose]);

  const set = <K extends keyof typeof BLANK>(k: K, v: (typeof BLANK)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const linkInvalid = !!form.link && !/^https?:\/\//i.test(form.link.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || linkInvalid) return;
    setSaving(true);
    const saved = await saveNotice({ ...form, title: form.title.trim(), link: form.link.trim() }, editing?.databaseId);
    setSaving(false);
    if (saved) onClose();
  };

  return (
    <AnimatePresence>
      {notice && (
        <motion.div className="ad-overlay ad-drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: "none" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
          <motion.form
            className="ad-drawer"
            style={{ width: "min(520px, 100vw)" }}
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Edit notice" : "Post a notice"}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }} /* same unit as initial/exit — a 0 ↔ "100%" mix never finished exiting */
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="ad-drawer-head">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span className="ad-kpi-icon ad-tone-brand"><Megaphone size={18} /></span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 750, color: "var(--ad-text)" }}>{editing ? "Edit notice" : "Post a notice"}</div>
                  <div className="ad-hint">Visible to every signed-in staff member</div>
                </div>
              </div>
              <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon" onClick={onClose} aria-label="Close" disabled={saving}><X size={18} /></button>
            </div>

            <div className="ad-drawer-body" style={{ display: "grid", gap: 16, alignContent: "start" }}>
              <label className="ad-field">
                <span className="ad-label">Title</span>
                <input className="ad-input" value={form.title} onChange={(e) => set("title", e.target.value)} required maxLength={140} autoFocus
                  placeholder="e.g. Clinical meeting moved to Thursday" />
              </label>

              <label className="ad-field">
                <span className="ad-label">Message</span>
                <textarea className="ad-textarea" rows={7} value={form.body} onChange={(e) => set("body", e.target.value)} maxLength={4000}
                  placeholder="What staff need to know. Plain text; line breaks are kept." />
                <span className="ad-hint" style={{ textAlign: "right" }}>{form.body.length}/4000</span>
              </label>

              <div className="ad-field">
                <span className="ad-label">Priority</span>
                <Segmented<NoticePriority>
                  id="nb-priority"
                  ariaLabel="Priority"
                  value={form.priority}
                  onChange={(v) => set("priority", v)}
                  options={[
                    { value: "normal", label: "Normal" },
                    { value: "important", label: "Important" },
                    { value: "urgent", label: <><AlertTriangle size={13} />Urgent</> },
                  ]}
                />
              </div>

              <div className="nb-grid2">
                <label className="ad-field">
                  <span className="ad-label">Category</span>
                  <select className="ad-select" value={form.category} onChange={(e) => set("category", e.target.value as NoticeCategory)}>
                    {NOTICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">For</span>
                  <select className="ad-select" value={form.audience} onChange={(e) => set("audience", e.target.value)}>
                    <option value="">All staff</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              </div>

              <div className="nb-grid2">
                <label className="ad-field">
                  <span className="ad-label">Show until (optional)</span>
                  <input className="ad-input" type="date" value={form.expiresOn} min={todayKey()} onChange={(e) => set("expiresOn", e.target.value)} />
                  <span className="ad-hint">Hidden from staff after this date</span>
                </label>
                <label className="ad-field">
                  <span className="ad-label">Link (optional)</span>
                  <input className="ad-input" type="url" inputMode="url" value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="https://" />
                  {linkInvalid && <span style={{ fontSize: 12, color: "var(--ad-danger)" }}>Must start with https://</span>}
                </label>
              </div>

              <div className="nb-toggle" data-warn={form.publicHeadline}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ad-text)", display: "flex", gap: 6, alignItems: "center" }}>
                    {form.publicHeadline ? <Globe size={14} /> : <Lock size={14} />}Show the title on the share link
                  </div>
                  <div className="ad-hint">
                    {form.publicHeadline
                      ? "Anyone with the link sees the title (not the message). Keep names and confidential details out of it."
                      : "The share link shows only “Staff-only notice”. The title needs a sign-in too."}
                  </div>
                </div>
                <Switch checked={form.publicHeadline} onChange={(v) => set("publicHeadline", v)} label="Show the title on the share link" />
              </div>

              <div className="nb-toggle">
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ad-text)", display: "flex", gap: 6, alignItems: "center" }}><Pin size={14} />Pin to the top</div>
                  <div className="ad-hint">Stays above newer notices until unpinned</div>
                </div>
                <Switch checked={form.pinned} onChange={(v) => set("pinned", v)} label="Pin to the top" />
              </div>

              {editing && (
                <div className="nb-toggle">
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--ad-text)", display: "flex", gap: 6, alignItems: "center" }}><Bell size={14} />Ask everyone to read it again</div>
                    <div className="ad-hint">Use for important changes. Clears who has read it ({editing.readCount ?? 0} so far)</div>
                  </div>
                  <Switch checked={form.resetReads} onChange={(v) => set("resetReads", v)} label="Ask everyone to read it again" />
                </div>
              )}
            </div>

            <div className="ad-drawer-foot">
              <button type="button" className="ad-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="ad-btn ad-btn--primary" disabled={saving || !form.title.trim() || linkInvalid}>
                <Megaphone size={15} />{saving ? "Saving…" : editing ? "Save changes" : "Post notice"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const NOTICE_CSS = `
  .nb-list { display: grid; gap: 12px; }
  .nb-card { position: relative; padding: 16px 18px 14px 22px; overflow: hidden; }
  .nb-card::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--tone); opacity: .85; }
  .nb-card[data-unread="true"] { box-shadow: var(--ad-shadow-md); }
  .nb-card[data-priority="urgent"] { background: color-mix(in srgb, var(--ad-danger-soft) 45%, var(--ad-surface)); }
  .nb-top { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
  .nb-pin { display: inline-flex; gap: 4px; align-items: center; font-size: 11.5px; font-weight: 700; color: var(--ad-gold-ink); }
  .nb-new { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: var(--ad-brand-ink); }
  .nb-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ad-brand-ink); box-shadow: 0 0 0 3px var(--ad-brand-soft); }
  .nb-title { margin: 0; font-size: 16.5px; font-weight: 750; letter-spacing: -0.01em; color: var(--ad-text); line-height: 1.35; }
  .nb-meta { margin-top: 4px; font-size: 12.5px; color: var(--ad-text-3); display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .nb-body { margin: 12px 0 0; font-size: 14px; line-height: 1.7; color: var(--ad-text-2); white-space: pre-wrap; overflow-wrap: anywhere; }
  .nb-body[data-open="false"] { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .nb-more { border: 0; background: none; padding: 0; margin-top: 6px; font: inherit; font-size: 13px; font-weight: 700; color: var(--ad-brand-ink); cursor: pointer; }
  .nb-foot { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--ad-border); }
  .nb-read { display: inline-flex; gap: 5px; align-items: center; font-size: 12.5px; font-weight: 600; color: var(--ad-success); }
  .nb-readcount { display: inline-flex; gap: 5px; align-items: center; font-size: 12px; color: var(--ad-text-3); margin-right: 6px; }
  .nb-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  @media (max-width: 520px) { .nb-grid2 { grid-template-columns: minmax(0, 1fr); } }
  .nb-card[data-focused="true"] { box-shadow: 0 0 0 2px var(--ad-brand-ink), var(--ad-shadow-md); }
  .nb-toggle[data-warn="true"] { border-color: color-mix(in srgb, var(--ad-gold) 55%, var(--ad-border)); }
  .nb-toggle { display: flex; gap: 16px; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid var(--ad-border); border-radius: 12px; background: var(--ad-surface-2); }
`;

/* ── Share today's notices ────────────────────────────────────────────── */

/**
 * A ready-to-paste message for the staff WhatsApp group: today's headlines
 * (public ones only) and the board link. Staff-only notices are counted but
 * never named, matching what the public page shows.
 */
function ShareDialog({ open, notices, onClose }: { open: boolean; notices: StaffNotice[]; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/notices`;
  const today = todayKey();
  const todays = notices.filter((n) => n.createdAt.slice(0, 10) >= today || n.pinned || n.priority === "urgent");
  const list = (todays.length ? todays : notices).slice(0, 8);
  const shown = list.filter((n) => n.publicHeadline !== false);
  const hidden = list.length - shown.length;
  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const message = [
    `*SECH staff notices, ${date}*`,
    "",
    ...shown.map((n) => `• ${n.priority === "urgent" ? "URGENT: " : n.priority === "important" ? "Important: " : ""}${n.title}`),
    ...(hidden ? [`• ${hidden} staff-only notice${hidden === 1 ? "" : "s"}`] : []),
    "",
    `Read in full (staff sign-in): ${link}`,
  ].join("\n");

  const copy = () => navigator.clipboard?.writeText(message).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }, () => {});

  return (
    <div className="ad-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ad-modal" style={{ maxWidth: 520 }} role="dialog" aria-modal="true" aria-label="Share today’s notices">
        <div className="ad-kpi-icon ad-tone-brand" style={{ marginBottom: 14 }}><Share2 size={18} /></div>
        <h3 className="ad-modal-title">Share today’s notices</h3>
        <p className="ad-modal-text" style={{ marginBottom: 12 }}>
          Paste this into the staff WhatsApp group or channel. The link shows headlines only; staff sign in to read the full notices.
        </p>
        <pre className="nb-share-preview">{message}</pre>
        <div className="ad-modal-actions" style={{ flexWrap: "wrap" }}>
          <button type="button" className="ad-btn" onClick={onClose}>Close</button>
          <a className="ad-btn" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">Open in WhatsApp</a>
          <button type="button" className="ad-btn ad-btn--primary" onClick={copy}>{copied ? <Check size={15} /> : <Link2 size={15} />}{copied ? "Copied" : "Copy message"}</button>
        </div>
        <style>{`.nb-share-preview { margin: 0 0 18px; padding: 12px 14px; border-radius: 10px; background: var(--ad-surface-2); border: 1px solid var(--ad-border); font: 13px/1.6 var(--ad-font); color: var(--ad-text-2); white-space: pre-wrap; overflow-wrap: anywhere; max-height: 260px; overflow-y: auto; }`}</style>
      </div>
    </div>
  );
}
