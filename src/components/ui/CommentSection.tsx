"use client";

import { useEffect, useState } from "react";

interface PublicComment {
  id: string;
  author: string;
  content: string;
  date: string;
}

/**
 * Comments on a news or achievement post.
 *
 * Every visitor-supplied string here is rendered as a React text node — never
 * through `dangerouslySetInnerHTML`. That single rule is what makes stored XSS
 * structurally impossible on this surface, and it is why the comment body is
 * plain text rather than HTML: there is no formatting to preserve, so there is
 * no reason to render markup.
 */
export function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [postId, setPostId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ author: "", email: "", content: "", website: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setPostId(typeof data.postId === "number" ? data.postId : null);
      })
      .catch(() => {
        /* Comments are additive — a failure here leaves the article readable. */
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || postId === null) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, postId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "We could not post your comment.");
        return;
      }
      setSubmitted(true);
      setForm({ author: "", email: "", content: "", website: "" });
    } catch {
      setError("No connection. Please check your network and try again.");
    } finally {
      setSending(false);
    }
  };

  const formatted = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const field: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem 0.85rem",
    borderRadius: "var(--radius-sm)",
    border: "1.5px solid #D7E4DC",
    fontSize: "0.92rem",
    fontFamily: "inherit",
    color: "var(--text-dark)",
    background: "#fff",
  };

  return (
    <section style={{ marginTop: "3.5rem" }} aria-labelledby="comments-heading">
      <h2
        id="comments-heading"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "1.45rem",
          fontWeight: 700,
          color: "var(--text-dark)",
          marginBottom: "0.35rem",
        }}
      >
        Comments
        {!loading && comments.length > 0 && (
          <span style={{ color: "var(--text-light)", fontWeight: 400 }}>
            {" "}
            ({comments.length})
          </span>
        )}
      </h2>
      <p style={{ color: "var(--text-light)", fontSize: "0.88rem", marginBottom: "1.75rem" }}>
        Comments are read by hospital staff before they appear. Please don&rsquo;t share
        personal medical details here. Call us on {" "}
        <a href="tel:0322298428" style={{ color: "var(--primary-light)", fontWeight: 600 }}>
          032 229 8428
        </a>{" "}
        instead.
      </p>

      {loading ? (
        <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>
          No comments yet. Be the first to leave one.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "1rem" }}>
          {comments.map((c) => (
            <li
              key={c.id}
              style={{
                background: "#fff",
                border: "1.5px solid #E2EBE7",
                borderRadius: "var(--radius-md)",
                padding: "1.1rem 1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 6,
                }}
              >
                {/* Text node — the author name is never markup. */}
                <span style={{ fontWeight: 700, color: "var(--text-dark)", fontSize: "0.92rem" }}>
                  {c.author}
                </span>
                <span style={{ color: "var(--text-light)", fontSize: "0.76rem" }}>
                  {formatted(c.date)}
                </span>
              </div>
              {/* Text node, and `white-space: pre-wrap` keeps the writer's line
                  breaks without any markup being involved. */}
              <p
                style={{
                  margin: 0,
                  color: "var(--text-mid)",
                  fontSize: "0.93rem",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {c.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          marginTop: "2rem",
          background: "var(--off-white)",
          border: "1.5px solid #E2EBE7",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
        }}
      >
        {submitted ? (
          <div role="status">
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--primary)",
                margin: "0 0 6px",
              }}
            >
              Thank you, your comment has been received
            </h3>
            <p style={{ margin: 0, color: "var(--text-mid)", fontSize: "0.9rem" }}>
              It will appear on this page once a member of staff has reviewed it.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              style={{
                marginTop: 14,
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--primary-light)",
                fontWeight: 600,
                fontSize: "0.88rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Write another comment
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--text-dark)",
                margin: "0 0 1rem",
              }}
            >
              Leave a comment
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.85rem",
                marginBottom: "0.85rem",
              }}
            >
              <div>
                <label htmlFor="comment-author" style={labelStyle}>
                  Name *
                </label>
                <input
                  id="comment-author"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  maxLength={60}
                  required
                  style={field}
                  placeholder="e.g. Ama Boateng"
                />
              </div>
              <div>
                <label htmlFor="comment-email" style={labelStyle}>
                  Email * <span style={{ fontWeight: 400 }}>(not published)</span>
                </label>
                <input
                  id="comment-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={254}
                  required
                  style={field}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <label htmlFor="comment-body" style={labelStyle}>
              Comment *
            </label>
            <textarea
              id="comment-body"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              maxLength={2000}
              required
              rows={5}
              style={{ ...field, resize: "vertical" }}
              placeholder="Share your thoughts…"
            />

            {/* Honeypot: hidden from people, filled in by bots. Not `display:none`
                — some bots skip those — and kept out of the tab order. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label htmlFor="comment-website">Website</label>
              <input
                id="comment-website"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>

            {error && (
              <p role="alert" style={{ color: "var(--red)", fontSize: "0.86rem", marginTop: 10 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending || postId === null}
              className="btn-accent"
              style={{
                marginTop: "1rem",
                opacity: sending || postId === null ? 0.6 : 1,
                cursor: sending || postId === null ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Posting…" : "Post comment"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-mid)",
  marginBottom: 6,
};
