"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminData } from "@/context/AdminDataContext";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

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

/** Comments grouped under the post they were left on, newest post first. */
function groupByPost(comments: PendingComment[]): PostGroup[] {
  const groups = new Map<number, PostGroup>();
  for (const c of comments) {
    const existing = groups.get(c.postId);
    if (existing) existing.items.push(c);
    else
      groups.set(c.postId, {
        postId: c.postId,
        title: c.postTitle,
        slug: c.postSlug,
        excerpt: c.postExcerpt,
        date: c.postDate,
        image: c.postImage,
        items: [c],
      });
  }
  return Array.from(groups.values());
}

/**
 * Moderation queue for public comments.
 *
 * Everything shown here is visitor-supplied, so every value is rendered as a
 * React text node — never `dangerouslySetInnerHTML`. It is already stripped to
 * plain text server-side; rendering it as text is the second layer, and the one
 * that matters most on an admin page where the reader is a logged-in user.
 */
export default function CommentsPage() {
  const { addToast } = useAdminData();
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (
    id: number,
    action: "approved" | "spam" | "delete",
    label: string,
  ) => {
    setBusyId(id);
    // Remove it from the list straight away; put it back if the call fails.
    const previous = comments;
    setComments((list) => list.filter((c) => c.id !== id));
    try {
      const res =
        action === "delete"
          ? await fetch(`/api/comments/${id}`, { method: "DELETE" })
          : await fetch(`/api/comments/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: action }),
            });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setComments(previous);
        addToast(data?.error ?? `Could not ${label} this comment.`, "danger");
        return;
      }
      addToast(label === "approve" ? "Comment approved and now public" : `Comment ${label}d`);
    } catch {
      setComments(previous);
      addToast("A network issue stopped that change.", "danger");
    } finally {
      setBusyId(null);
    }
  };

  const when = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const onlyDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const btn = (bg: string, color: string): React.CSSProperties => ({
    padding: "7px 14px",
    border: bg === "#fff" ? "0.5px solid #d1d5db" : "none",
    borderRadius: 7,
    background: bg,
    color,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  });

  return (
    <>
      <style>{`
        .cmt-group {
          display: grid;
          /* minmax(0,1fr) rather than 1fr: a grid track sizes to its content by
             default, so one long unbroken word in a comment would widen the
             column and push the post off the edge. */
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 20px;
          align-items: start;
        }
        .cmt-group + .cmt-group {
          border-top: 1.5px solid #e5e7eb;
          padding-top: 28px;
        }
        /* Clears the sticky topbar (~60px) so the card parks below it. */
        .cmt-post { position: sticky; top: 80px; }
        @media (max-width: 1100px) {
          .cmt-group { grid-template-columns: 1fr; }
          /* Stacked, the post reads first — you need to know what was said
             before you can judge a reply to it. */
          .cmt-post { position: static; order: -1; }
        }
      `}</style>

      {/* Topbar */}
      <div
        style={{
          // Sticks to the top of the admin scroll container so the page title
          // and its actions stay reachable while a long list scrolls beneath.
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "#fff",
          borderBottom: "0.5px solid #e5e7eb",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>Comments</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
            {loading
              ? "Loading…"
              : comments.length === 0
                ? "Nothing waiting for review"
                : `${comments.length} awaiting review across ${
                    groupByPost(comments).length
                  } post${groupByPost(comments).length === 1 ? "" : "s"}`}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={load} style={btn("#fff", "#555")} disabled={loading}>
            Refresh
          </button>
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {error ? (
          <div
            style={{
              background: "#FEE2E2",
              color: "#DC2626",
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        ) : loading ? (
          <div style={{ color: "#93A29B", fontSize: 13 }}>Loading comments…</div>
        ) : comments.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "0.5px solid #e5e7eb",
              borderRadius: 10,
              padding: "3rem 2rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 6 }}>
              No comments waiting
            </div>
            <div style={{ fontSize: 13, color: "#93A29B" }}>
              New comments from the public site appear here for approval before they
              go live.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 28 }}>
            {groupByPost(comments).map((group) => (
              <section key={group.postId} className="cmt-group">
                {/* Comments on the left. They come first in the DOM so the
                    stylesheet can lift the post above them on a narrow screen
                    without the queue itself losing its reading order. */}
                <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
                  {group.items.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#fff",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: 10,
                  padding: 18,
                  opacity: busyId === c.id ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  <div>
                    {/* Text nodes — visitor-supplied, never markup. */}
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>
                      {c.author}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#93A29B", marginTop: 2 }}>
                      {c.email}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#93A29B", textAlign: "right" }}>
                    <div>{when(c.date)}</div>
                  </div>
                </div>

                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    color: "#333",
                    background: "#F7F9F7",
                    borderRadius: 6,
                    padding: "10px 12px",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {c.content}
                </p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => act(c.id, "approved", "approve")}
                    disabled={busyId === c.id}
                    style={btn("#0A4F3C", "#fff")}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(c.id, "spam", "mark as spam")}
                    disabled={busyId === c.id}
                    style={btn("#fff", "#555")}
                  >
                    Spam
                  </button>
                  <button
                    onClick={() => act(c.id, "delete", "delete")}
                    disabled={busyId === c.id}
                    style={btn("#fff", "#DC2626")}
                  >
                    Delete
                  </button>
                </div>
              </div>
                  ))}
                </div>

                {/* The post itself on the right, pinned while its comments
                    scroll past — a moderator judging "is this on topic?" should
                    not have to scroll back up to remember what the post said. */}
                <aside className="cmt-post">
                  <div
                    style={{
                      background: "#fff",
                      border: "0.5px solid #e5e7eb",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {group.image && (
                      // Decorative here: the real alt text is on the article
                      // itself, and WordPress alt text is author-supplied.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={group.image}
                        alt=""
                        loading="lazy"
                        style={{
                          display: "block",
                          width: "100%",
                          height: 130,
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <div style={{ padding: 16 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#93A29B",
                          marginBottom: 5,
                        }}
                      >
                        Commented post
                      </div>
                      <div
                        style={{
                          fontSize: 14.5,
                          fontWeight: 700,
                          color: "#111",
                          lineHeight: 1.35,
                        }}
                      >
                        {group.title}
                      </div>
                      {group.date && (
                        <div style={{ fontSize: 11.5, color: "#93A29B", marginTop: 5 }}>
                          Published {onlyDate(group.date)}
                        </div>
                      )}
                      {group.excerpt && (
                        <p
                          style={{
                            margin: "10px 0 0",
                            fontSize: 12.5,
                            lineHeight: 1.65,
                            color: "#555",
                          }}
                        >
                          {group.excerpt}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          flexWrap: "wrap",
                          marginTop: 14,
                          paddingTop: 12,
                          borderTop: "0.5px solid #e5e7eb",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#0A4F3C",
                            background: "#EAF2EE",
                            padding: "3px 10px",
                            borderRadius: 20,
                          }}
                        >
                          {group.items.length} awaiting
                        </span>
                        {group.slug && (
                          <a
                            href={`/news/${group.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#0A4F3C",
                              textDecoration: "underline",
                            }}
                          >
                            View post ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </aside>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
