"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  ImageOff,
  Link2,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Avatar, ConfirmDialog, EmptyState, PageHeader, Skeleton } from "@/components/admin/ui";

interface PendingComment {
  id: number;
  postId: number;
  author: string;
  email: string;
  content: string;
  date: string;
  postTitle: string;
  postSlug: string;
  postExcerpt: string;
  postDate: string;
  postImage: string;
}

interface PostGroup {
  postId: number;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  image: string;
  items: PendingComment[];
}

type Action = "approved" | "spam" | "delete";

const LINK_RE = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|ru|xyz|info|top|online|site|shop)\b/i;

/** Comments grouped under the post they were left on. */
function groupByPost(comments: PendingComment[]): PostGroup[] {
  const groups = new Map<number, PostGroup>();
  for (const c of comments) {
    const g = groups.get(c.postId);
    if (g) g.items.push(c);
    else groups.set(c.postId, {
      postId: c.postId, title: c.postTitle, slug: c.postSlug, excerpt: c.postExcerpt,
      date: c.postDate, image: c.postImage, items: [c],
    });
  }
  return Array.from(groups.values());
}

function when(iso: string, withTime = true) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", withTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Moderation queue for public comments.
 *
 * Everything here is visitor-supplied, so every value is rendered as a React
 * text node — never dangerouslySetInnerHTML. It is already stripped to plain
 * text server-side; rendering it as text is the second layer, and the one that
 * matters most on an admin page where the reader is a logged-in user.
 */
export default function CommentsPage() {
  const { addToast, refreshPendingComments } = useAdminData();
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [linksOnly, setLinksOnly] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<{ done: number; of: number } | null>(null);
  const [confirm, setConfirm] = useState<{ action: Action; ids: number[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/comments/pending");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not load the moderation queue.");
        return;
      }
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return comments.filter((c) =>
      (!linksOnly || LINK_RE.test(c.content)) &&
      (!q || `${c.author} ${c.email} ${c.content} ${c.postTitle}`.toLowerCase().includes(q)),
    );
  }, [comments, query, linksOnly]);

  const groups = useMemo(() => groupByPost(visible), [visible]);
  const withLinks = useMemo(() => comments.filter((c) => LINK_RE.test(c.content)), [comments]);

  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(visible.map((c) => c.id));
      const next = new Set(Array.from(prev).filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visible]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleGroup = (g: PostGroup) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const all = g.items.every((c) => next.has(c.id));
      g.items.forEach((c) => (all ? next.delete(c.id) : next.add(c.id)));
      return next;
    });

  /** One request per comment, four at a time, removing each as it succeeds. */
  const moderate = async (ids: number[], action: Action) => {
    if (!ids.length) return;
    setProgress({ done: 0, of: ids.length });
    let ok = 0;
    let failed = 0;
    const queue = [...ids];
    const worker = async () => {
      while (queue.length) {
        const id = queue.shift()!;
        try {
          const res = action === "delete"
            ? await fetch(`/api/comments/${id}`, { method: "DELETE" })
            : await fetch(`/api/comments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action }),
              });
          if (res.ok) {
            ok++;
            setComments((list) => list.filter((c) => c.id !== id));
            setTotal((t) => Math.max(0, t - 1));
          } else failed++;
        } catch {
          failed++;
        }
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    setProgress(null);
    setSelected(new Set());

    const verb = action === "approved" ? "approved and now public" : action === "spam" ? "marked as spam" : "moved to trash";
    if (ok) addToast(`${ok} comment${ok === 1 ? "" : "s"} ${verb}`);
    if (failed) addToast(`${failed} could not be updated. Try again.`, "danger");
    refreshPendingComments();
    // The queue page holds 50; fetch the next batch once this one is cleared.
    if (ok && comments.length - ok <= 0 && total - ok > 0) load();
  };

  const ask = (action: Action, ids: number[]) => {
    // Single spam/delete clicks are reversible (spam folder, trash); approving
    // publishes, and bulk anything is worth one confirmation.
    if (ids.length === 1 && action !== "approved") moderate(ids, action);
    else setConfirm({ action, ids });
  };

  const busy = progress !== null;
  const selectedIds = Array.from(selected);

  return (
    <>
      <PageHeader
        title="Comments"
        subtitle={
          loading ? "Loading the moderation queue…"
            : total === 0 ? "Nothing waiting for review"
            : `${total} awaiting review${total > comments.length ? ` · showing ${comments.length} at a time` : ""}`
        }
        actions={
          <button type="button" className="po-btn" onClick={() => { load(); refreshPendingComments(); }} disabled={loading || busy}>
            <RefreshCw size={15} className={loading ? "po-spin" : ""} />Refresh
          </button>
        }
      />

      {!loading && withLinks.length >= 5 && (
        <div className="po-alert po-tone-warn" style={{ marginBottom: 16, alignItems: "center" }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{withLinks.length} of these {comments.length} contain links</strong>, the usual signature of spam bots.
            Nothing held here has been shown on the website.
          </span>
          <button type="button" className="po-btn po-btn--sm" disabled={busy}
            onClick={() => { setLinksOnly(true); setSelected(new Set(withLinks.map((c) => c.id))); }}>
            <Link2 size={14} />Select all with links
          </button>
        </div>
      )}

      <section className="po-card" style={{ marginBottom: 16 }}>
        <div className="po-toolbar">
          <div className="po-input-wrap" style={{ flex: "1 1 260px", maxWidth: 380 }}>
            <Search size={15} />
            <input className="po-input" placeholder="Search name, email, text or post" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search comments" />
          </div>
          <button type="button" className="po-btn" aria-pressed={linksOnly} onClick={() => setLinksOnly((v) => !v)}
            style={linksOnly ? { borderColor: "var(--po-warn)", color: "var(--po-warn)", background: "var(--po-warn-soft)" } : undefined}>
            <Link2 size={15} />Contains a link{linksOnly ? "" : ` (${withLinks.length})`}
          </button>
          {visible.length > 0 && (
            <label className="po-check" style={{ marginLeft: "auto" }}>
              <input type="checkbox" className="po-cb"
                checked={visible.every((c) => selected.has(c.id))}
                onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((c) => c.id)) : new Set())} />
              Select all {visible.length} shown
            </label>
          )}
        </div>
      </section>

      {error ? (
        <section className="po-card">
          <EmptyState icon={AlertTriangle} title="Couldn’t load comments" text={error}
            action={<button type="button" className="po-btn" onClick={load}><RefreshCw size={15} />Try again</button>} />
        </section>
      ) : loading && comments.length === 0 ? (
        <div style={{ display: "grid", gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={130} r={12} />)}</div>
      ) : visible.length === 0 ? (
        <section className="po-card">
          <EmptyState
            icon={MessageSquare}
            title={comments.length ? "No comments match" : "All caught up"}
            text={comments.length ? "Try a different search or filter." : "New comments from the website appear here for approval before they go live."}
          />
        </section>
      ) : (
        <div style={{ display: "grid", gap: 28 }}>
          {groups.map((group) => {
            const allInGroup = group.items.every((c) => selected.has(c.id));
            return (
              <section key={group.postId} className="cmt-group">
                {/* Comments on the left — first in the DOM so the stylesheet can
                    lift the post above them on narrow screens. */}
                <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                  <AnimatePresence initial={false}>
                    {group.items.map((c) => {
                      const hasLink = LINK_RE.test(c.content);
                      const isSel = selected.has(c.id);
                      return (
                        <motion.article
                          key={c.id}
                          layout
                          className="po-card cmt-card"
                          data-selected={isSel}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -40, height: 0, marginTop: -10, transition: { duration: 0.22 } }}
                        >
                          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <input type="checkbox" className="po-cb" style={{ marginTop: 10 }} checked={isSel} onChange={() => toggle(c.id)} aria-label={`Select comment by ${c.author}`} />
                            <Avatar name={c.author} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                                {/* Text nodes — visitor-supplied, never markup. */}
                                <span className="po-cell-main">{c.author}</span>
                                <span className="po-cell-sub">{c.email}</span>
                                <span className="po-cell-sub" style={{ marginLeft: "auto" }}>{when(c.date)}</span>
                              </div>
                              {hasLink && (
                                <div style={{ marginTop: 6 }}>
                                  <span className="po-badge po-badge--plain po-tone-warn" style={{ textTransform: "none" }}><Link2 size={12} />Contains a link</span>
                                </div>
                              )}
                              <p className="cmt-text">{c.content}</p>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button type="button" className="po-btn po-btn--sm po-btn--success-soft" disabled={busy} onClick={() => ask("approved", [c.id])}>
                                  <Check size={14} strokeWidth={2.6} />Approve
                                </button>
                                <button type="button" className="po-btn po-btn--sm" disabled={busy} onClick={() => ask("spam", [c.id])}>
                                  <ShieldAlert size={14} />Spam
                                </button>
                                <button type="button" className="po-btn po-btn--sm po-btn--ghost" disabled={busy} onClick={() => ask("delete", [c.id])} style={{ color: "var(--po-danger)" }}>
                                  <Trash2 size={14} />Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* The post, pinned beside its comments. */}
                <aside className="cmt-post">
                  <div className="po-card" style={{ overflow: "hidden" }}>
                    <div className="cmt-post-img">
                      {group.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={group.image} alt="" loading="lazy" />
                      ) : (
                        <ImageOff size={24} strokeWidth={1.6} />
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <div className="po-menu-label" style={{ padding: 0, marginBottom: 6 }}>Commented post</div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--po-text)", lineHeight: 1.35 }}>{group.title}</div>
                      {group.date && <div className="po-cell-sub" style={{ marginTop: 4 }}>Published {when(group.date, false)}</div>}
                      {group.excerpt && <p className="po-clamp-2" style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "var(--po-text-2)", WebkitLineClamp: 4 } as React.CSSProperties}>{group.excerpt}</p>}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--po-border)", flexWrap: "wrap" }}>
                        <label className="po-check" style={{ fontSize: 12.5 }}>
                          <input type="checkbox" className="po-cb" checked={allInGroup} onChange={() => toggleGroup(group)} />
                          {group.items.length} awaiting
                        </label>
                        {group.slug && (
                          <a href={`/news/${group.slug}`} target="_blank" rel="noopener noreferrer" className="po-card-link" style={{ marginLeft: "auto" }}>
                            View post <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </aside>
              </section>
            );
          })}
        </div>
      )}

      {/* Bulk bar / progress */}
      <AnimatePresence>
        {(selected.size > 0 || busy) && (
          <motion.div
            className="po-bulkbar"
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 24, x: "-50%" }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            role="toolbar"
            aria-label="Bulk moderation"
          >
            {busy && progress ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 8px 4px 0", minWidth: 260 }}>
                <RefreshCw size={15} className="po-spin" />
                <span>Working… {progress.done} of {progress.of}</span>
                <div className="po-meter" style={{ flex: 1, background: "rgba(255,255,255,0.12)" }}>
                  <span style={{ width: `${(progress.done / progress.of) * 100}%`, ["--tone" as string]: "var(--po-gold)", animation: "none", transition: "width .2s" }} />
                </div>
              </div>
            ) : (
              <>
                <strong>{selected.size} selected</strong>
                <span className="po-bulkbar-sep" />
                <button type="button" className="po-btn po-btn--sm" onClick={() => ask("approved", selectedIds)}><Check size={14} />Approve</button>
                <button type="button" className="po-btn po-btn--sm po-btn--gold" onClick={() => ask("spam", selectedIds)}><ShieldAlert size={14} />Mark as spam</button>
                <button type="button" className="po-btn po-btn--sm po-btn--danger-soft" onClick={() => ask("delete", selectedIds)}><Trash2 size={14} />Delete</button>
                <button type="button" className="po-btn po-btn--sm po-btn--ghost po-btn--icon" onClick={() => setSelected(new Set())} aria-label="Clear selection"><X size={15} /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!confirm}
        icon={confirm?.action === "approved" ? Check : confirm?.action === "spam" ? ShieldAlert : Trash2}
        tone={confirm?.action === "approved" ? "primary" : "danger"}
        title={
          !confirm ? "" :
          confirm.action === "approved" ? `Approve ${confirm.ids.length === 1 ? "this comment" : `${confirm.ids.length} comments`}?` :
          confirm.action === "spam" ? `Mark ${confirm.ids.length} comments as spam?` :
          `Delete ${confirm.ids.length} comments?`
        }
        text={
          !confirm ? "" :
          confirm.action === "approved" ? "Approved comments appear publicly under their post straight away. Make sure none contain personal health details or links you would not want on the hospital’s website." :
          confirm.action === "spam" ? "They move to WordPress’s spam folder and are never shown on the website." :
          "They move to the WordPress trash, where they can be restored for 30 days."
        }
        confirmLabel={!confirm ? "" : confirm.action === "approved" ? "Approve and publish" : confirm.action === "spam" ? "Mark as spam" : "Move to trash"}
        onConfirm={() => { const c = confirm; setConfirm(null); if (c) moderate(c.ids, c.action); }}
        onCancel={() => setConfirm(null)}
      />

      <style>{`
        .cmt-group { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
        .cmt-group + .cmt-group { border-top: 1px solid var(--po-border); padding-top: 28px; }
        .cmt-post { position: sticky; top: 16px; }
        @media (max-width: 1100px) {
          .cmt-group { grid-template-columns: minmax(0, 1fr); }
          .cmt-post { position: static; order: -1; }
        }
        .cmt-card { padding: 14px 16px; overflow: hidden; }
        .cmt-card[data-selected="true"] { box-shadow: 0 0 0 2px var(--po-brand-ink); }
        .cmt-text {
          margin: 10px 0 12px; padding: 10px 12px; border-radius: 10px;
          background: var(--po-surface-2); border: 1px solid var(--po-border);
          font-size: 13.5px; line-height: 1.65; color: var(--po-text-2);
          white-space: pre-wrap; overflow-wrap: anywhere;
          max-height: 180px; overflow-y: auto;
        }
        .cmt-post-img { height: 120px; overflow: hidden; background: var(--po-surface-3); display: grid; place-items: center; color: var(--po-text-3); }
        .cmt-post-img img { width: 100%; height: 100% !important; object-fit: cover; display: block; }
      `}</style>
    </>
  );
}
