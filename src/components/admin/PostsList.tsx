"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Send,
  ExternalLink,
  Eye,
  EyeOff,
  FilePlus2,
  ImageOff,
  LayoutGrid,
  List,
  MessageSquare,
  MessageSquareOff,
  Newspaper,
  PenLine,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import type { AdminPost } from "@/lib/wp-posts";
import {
  Chip,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Segmented,
  SkeletonRows,
  StatusBadge,
  type Tone,
  useInitialParam,
} from "@/components/admin/ui";

type StatusFilter = "all" | "published" | "pending" | "draft";
type TypeFilter = "all" | AdminPost["type"];

const TYPE_TONE: Record<AdminPost["type"], Tone> = {
  news: "info",
  blog: "violet",
  event: "gold",
  announcement: "teal",
};

const TYPES: AdminPost["type"][] = ["news", "blog", "event", "announcement"];

/**
 * The post list, shared by the admin console (every post) and the staff area
 * (the writer's own). What each person may do comes from their permissions;
 * the server applies the same rules, so this only decides what to offer.
 */
export function PostsList({ base }: { base: "/admin/posts" | "/staff/posts" }) {
  const { posts: allPosts, postsLoading, postsError, refreshPosts, updatePost, deletePost, addToast } = useAdminData();
  const { admin } = useAuth();
  const canPublish = can(admin?.perms, "posts.publish");
  const isStaff = base === "/staff/posts";
  // "My posts" means the person's own, even for an admin who can see every
  // post. (Staff writers only ever receive their own from the server anyway.)
  const posts = useMemo(
    () => (isStaff && admin?.id ? allPosts.filter((p) => p.authorId === admin.id) : allPosts),
    [allPosts, isStaff, admin?.id],
  );

  const initialStatus = useInitialParam("status");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [toDelete, setToDelete] = useState<AdminPost[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (initialStatus === "draft" || initialStatus === "published" || initialStatus === "pending") setStatus(initialStatus);
  }, [initialStatus]);

  // The view choice is a per-browser convenience.
  useEffect(() => {
    try {
      const v = localStorage.getItem("sech_posts_view");
      if (v === "grid" || v === "table") setView(v);
    } catch { /* storage unavailable */ }
  }, []);
  const chooseView = (v: "table" | "grid") => {
    setView(v);
    try { localStorage.setItem("sech_posts_view", v); } catch { /* ignore */ }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) =>
      (status === "all" || p.status === status) &&
      (type === "all" || p.type === type) &&
      (!q || `${p.title} ${p.excerpt} ${p.author}`.toLowerCase().includes(q)),
    );
  }, [posts, status, type, query]);

  // Drop selections that the filter has hidden, so bulk actions only ever
  // touch rows the editor can see.
  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(filtered.map((p) => p.id));
      const next = new Set(Array.from(prev).filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const counts = {
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
    pending: posts.filter((p) => p.status === "pending").length,
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(filtered.map((p) => p.id)));

  const selectedPosts = posts.filter((p) => selected.has(p.id));

  const setStatusFor = async (list: AdminPost[], next: AdminPost["status"]) => {
    const targets = list.filter((p) => p.status !== next);
    if (targets.length === 0) return;
    setBusy(true);
    let ok = 0;
    let held = 0;
    // One at a time: WordPress handles these fine sequentially, and a failure
    // part-way leaves the rest untouched rather than half-applied in parallel.
    for (const p of targets) {
      try {
        const saved = await updatePost(p.id, { status: next });
        // Report what WordPress stored, not what was asked for.
        if (saved.status === next) ok++;
        else if (saved.status === "pending") held++;
      } catch { /* updatePost has already reported it */ }
    }
    setBusy(false);
    setSelected(new Set());
    if (ok) {
      const s = ok === 1 ? "" : "s";
      addToast(
        next === "published" ? `${ok} post${s} published`
          : next === "pending" ? `${ok} post${s} submitted for review`
          : `${ok} moved to drafts`,
      );
    }
    if (held) {
      addToast(`${held} post${held === 1 ? " was" : "s were"} sent for review instead. Your account can’t publish.`, "warn");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    for (const p of toDelete) await deletePost(p.id);
    setBusy(false);
    setToDelete(null);
    setSelected(new Set());
  };

  const refresh = async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  };

  return (
    <>
      <PageHeader
        title={isStaff ? "My posts" : "News & Blogs"}
        subtitle={
          isStaff
            ? `${counts.draft} draft${counts.draft === 1 ? "" : "s"} · ${counts.pending} waiting for review · ${counts.published} published`
            : `${counts.all} posts · ${counts.published} published · ${counts.pending} awaiting review · ${counts.draft} draft${counts.draft === 1 ? "" : "s"}`
        }
        actions={
          <>
            <button type="button" className="ad-btn" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "ad-spin" : ""} />
              Refresh
            </button>
            <Link href={`${base}/new`} className="ad-btn ad-btn--primary">
              <FilePlus2 size={16} />
              New post
            </Link>
          </>
        }
      />

      <section className="ad-card">
        {/* Toolbar */}
        <div className="ad-toolbar">
          <Segmented<StatusFilter>
            id="posts-status"
            ariaLabel="Filter by status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All", count: counts.all },
              { value: "published", label: "Published", count: counts.published },
              { value: "pending", label: canPublish ? "Awaiting review" : "In review", count: counts.pending },
              { value: "draft", label: "Drafts", count: counts.draft },
            ]}
          />
          <select className="ad-select" style={{ width: 170 }} value={type} onChange={(e) => setType(e.target.value as TypeFilter)} aria-label="Filter by type">
            <option value="all">All types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </select>
          <div className="ad-input-wrap" style={{ flex: "1 1 220px", maxWidth: 340 }}>
            <Search size={15} />
            <input className="ad-input" placeholder="Search title, excerpt or author" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search posts" />
          </div>
          <div className="ad-seg" style={{ marginLeft: "auto" }} role="group" aria-label="Layout">
            <button type="button" className="ad-seg-btn" aria-pressed={view === "table"} onClick={() => chooseView("table")} title="Table">
              {view === "table" && <motion.span layoutId="posts-view" className="ad-seg-pill" />}
              <List size={15} />
            </button>
            <button type="button" className="ad-seg-btn" aria-pressed={view === "grid"} onClick={() => chooseView("grid")} title="Cards">
              {view === "grid" && <motion.span layoutId="posts-view" className="ad-seg-pill" />}
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>
        <hr className="ad-divider" />

        {postsLoading && posts.length === 0 ? (
          <SkeletonRows rows={6} cols={5} />
        ) : postsError ? (
          <EmptyState
            icon={AlertTriangle}
            title="Couldn’t load posts"
            text={postsError}
            action={<button type="button" className="ad-btn" onClick={refresh}><RefreshCw size={15} />Try again</button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={posts.length ? "No posts match" : "No posts yet"}
            text={posts.length ? "Try a different filter or search term." : "Publish news, blogs, events and announcements for the website."}
            action={
              posts.length ? (
                <button type="button" className="ad-btn" onClick={() => { setQuery(""); setStatus("all"); setType("all"); }}>
                  <X size={15} />Clear filters
                </button>
              ) : (
                <Link href={`${base}/new`} className="ad-btn ad-btn--primary"><FilePlus2 size={15} />Write a post</Link>
              )
            }
          />
        ) : view === "table" ? (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input type="checkbox" className="ad-cb" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all visible posts" />
                  </th>
                  <th>Post</th>
                  <th>Type</th>
                  <th>Author</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} data-selected={selected.has(p.id)}>
                    <td>
                      <input type="checkbox" className="ad-cb" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.title}`} />
                    </td>
                    <td style={{ maxWidth: 420 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <Thumb post={p} size={46} />
                        <div style={{ minWidth: 0 }}>
                          <Link href={`${base}/${p.id}/edit`} className="ad-cell-main ad-post-link">{p.title}</Link>
                          <div className="ad-cell-sub ad-clamp-1">{p.excerpt || "No excerpt"}</div>
                        </div>
                      </div>
                    </td>
                    <td><Chip tone={TYPE_TONE[p.type]}>{p.type}</Chip></td>
                    <td style={{ whiteSpace: "nowrap" }}>{p.author}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{p.date || "No date"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusBadge status={p.status} label={p.status === "pending" ? "In review" : undefined} />
                        <span title={p.commentsOpen ? "Comments open" : "Comments closed"} style={{ color: "var(--ad-text-3)", display: "inline-flex" }}>
                          {p.commentsOpen ? <MessageSquare size={14} /> : <MessageSquareOff size={14} />}
                        </span>
                      </div>
                    </td>
                    <td>
                      <RowActions post={p} base={base} canPublish={canPublish} onStatus={(next) => setStatusFor([p], next)} onDelete={() => setToDelete([p])} busy={busy} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ad-post-grid">
            {filtered.map((p, i) => (
              <motion.article
                key={p.id}
                className="ad-card ad-card--hover ad-post-card"
                data-selected={selected.has(p.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.03 }}
              >
                <div style={{ position: "relative" }}>
                  <Thumb post={p} size="cover" />
                  <input
                    type="checkbox"
                    className="ad-cb ad-post-card-cb"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    aria-label={`Select ${p.title}`}
                  />
                  <span className="ad-post-card-status"><StatusBadge status={p.status} label={p.status === "pending" ? "In review" : undefined} /></span>
                </div>
                <div style={{ padding: "14px 16px 12px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Chip tone={TYPE_TONE[p.type]}>{p.type}</Chip>
                    <span className="ad-cell-sub">{p.date || "Undated"}</span>
                  </div>
                  <Link href={`${base}/${p.id}/edit`} className="ad-post-link" style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.35 }}>{p.title}</Link>
                  <p className="ad-clamp-2" style={{ margin: 0, fontSize: 13, color: "var(--ad-text-3)" }}>{p.excerpt || "No excerpt"}</p>
                </div>
                <hr className="ad-divider" />
                <div style={{ padding: "8px 10px", display: "flex", alignItems: "center" }}>
                  <span className="ad-cell-sub" style={{ paddingLeft: 6 }}>{p.author}</span>
                  <div style={{ marginLeft: "auto" }}>
                    <RowActions post={p} base={base} canPublish={canPublish} onStatus={(next) => setStatusFor([p], next)} onDelete={() => setToDelete([p])} busy={busy} />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            className="ad-bulkbar"
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 24, x: "-50%" }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            role="toolbar"
            aria-label="Bulk actions"
          >
            <strong>{selected.size} selected</strong>
            <span className="ad-bulkbar-sep" />
            {canPublish ? (
              <>
                <button type="button" className="ad-btn ad-btn--sm ad-btn--gold" disabled={busy} onClick={() => setStatusFor(selectedPosts, "published")}>
                  <Eye size={14} />Publish
                </button>
                <button type="button" className="ad-btn ad-btn--sm" disabled={busy} onClick={() => setStatusFor(selectedPosts, "draft")}>
                  <EyeOff size={14} />Move to drafts
                </button>
              </>
            ) : (
              <button type="button" className="ad-btn ad-btn--sm ad-btn--gold" disabled={busy || !selectedPosts.some((p) => p.status === "draft")}
                onClick={() => setStatusFor(selectedPosts.filter((p) => p.status === "draft"), "pending")}>
                <Send size={14} />Submit for review
              </button>
            )}
            {/* Live posts can only be removed by someone who can publish. */}
            <button type="button" className="ad-btn ad-btn--sm ad-btn--danger-soft"
              disabled={busy || (!canPublish && !selectedPosts.some((p) => p.status !== "published"))}
              onClick={() => setToDelete(canPublish ? selectedPosts : selectedPosts.filter((p) => p.status !== "published"))}>
              <Trash2 size={14} />Delete
            </button>
            <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={() => setSelected(new Set())} aria-label="Clear selection">
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!toDelete}
        icon={Trash2}
        title={toDelete && toDelete.length > 1 ? `Delete ${toDelete.length} posts?` : "Delete this post?"}
        text={
          toDelete && toDelete.length === 1 ? (
            <>“{toDelete[0].title}” will be moved to the WordPress trash and removed from the website. It can be restored from wp-admin.</>
          ) : (
            <>These posts will be moved to the WordPress trash and removed from the website. They can be restored from wp-admin.</>
          )
        }
        confirmLabel="Move to trash"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <style>{`
        .ad-post-link { color: var(--ad-text); text-decoration: none; font-weight: 600; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ad-post-card .ad-post-link { white-space: normal; }
        .ad-post-link:hover { color: var(--ad-brand-ink); }
        .ad-post-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr)); gap: 16px; padding: 16px; }
        .ad-post-card { display: flex; flex-direction: column; overflow: hidden; }
        .ad-post-card[data-selected="true"] { box-shadow: 0 0 0 2px var(--ad-brand-ink); }
        .ad-post-card-status { position: absolute; right: 10px; top: 10px; }
        /* Over a photo the soft badge tint vanishes; give it a solid backing. */
        .ad-post-card-status .ad-badge { background: var(--ad-surface); box-shadow: var(--ad-shadow-md); }
        .ad-post-card-cb { position: absolute; left: 10px; top: 10px; width: 18px; height: 18px; }
        .ad-thumb { flex-shrink: 0; border-radius: 10px; overflow: hidden; background: var(--ad-surface-3); display: grid; place-items: center; color: var(--ad-text-3); }
        .ad-thumb img { width: 100%; height: 100% !important; object-fit: cover; display: block; }
      `}</style>
    </>
  );
}

function Thumb({ post, size }: { post: AdminPost; size: number | "cover" }) {
  const style: React.CSSProperties =
    size === "cover" ? { width: "100%", height: 150, borderRadius: 0 } : { width: size, height: size };
  return (
    <div className="ad-thumb" style={style}>
      {post.featuredImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.featuredImageUrl} alt="" loading="lazy" />
      ) : (
        <ImageOff size={size === "cover" ? 26 : 18} strokeWidth={1.6} />
      )}
    </div>
  );
}

function RowActions({ post, base, canPublish, onStatus, onDelete, busy }: {
  post: AdminPost;
  base: string;
  canPublish: boolean;
  onStatus: (next: AdminPost["status"]) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const published = post.status === "published";
  // A staff writer can no longer change a post once it is live.
  const editable = canPublish || !published;
  return (
    <div className="ad-row-actions">
      {editable && (
        <Link href={`${base}/${post.id}/edit`} className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" title="Edit" aria-label={`Edit ${post.title}`}>
          <PenLine size={15} />
        </Link>
      )}
      {canPublish ? (
        post.status === "pending" ? (
          <button type="button" className="ad-btn ad-btn--sm ad-btn--success-soft" onClick={() => onStatus("published")} disabled={busy}
            title="Approve and publish" aria-label={`Approve and publish ${post.title}`}>
            <Check size={14} strokeWidth={2.6} />Approve
          </button>
        ) : (
          <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={() => onStatus(published ? "draft" : "published")} disabled={busy}
            title={published ? "Move to drafts" : "Publish"} aria-label={published ? `Unpublish ${post.title}` : `Publish ${post.title}`}>
            {published ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )
      ) : post.status === "draft" ? (
        <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={() => onStatus("pending")} disabled={busy}
          title="Submit for review" aria-label={`Submit ${post.title} for review`}>
          <Send size={15} />
        </button>
      ) : null}
      {published && post.slug && (
        <a href={`/news/${post.slug}`} target="_blank" rel="noopener noreferrer" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" title="View on website" aria-label={`View ${post.title} on the website`}>
          <ExternalLink size={15} />
        </a>
      )}
      {editable && (
        <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost ad-btn--icon" onClick={onDelete} disabled={busy}
          title="Delete" aria-label={`Delete ${post.title}`} style={{ color: "var(--ad-danger)" }}>
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
