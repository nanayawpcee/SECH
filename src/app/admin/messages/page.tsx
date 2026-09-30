"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCheck,
  Inbox,
  Mail,
  MailOpen,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { Avatar, Chip, ConfirmDialog, EmptyState, PageHeader, Segmented, SkeletonRows, type Tone } from "@/components/admin/ui";
import { SITE } from "@/lib/data";
import { topicLabel, type ContactMessage } from "@/lib/wp-messages";

type Filter = "open" | "new" | "done" | "all";

const TOPIC_TONE: Record<string, Tone> = {
  complaint: "danger",
  feedback: "success",
  appointments: "info",
  billing: "gold",
  records: "violet",
  media: "teal",
};

function when(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

/** Contact-form inbox. Administrators only — messages can hold complaints and personal details. */
export default function MessagesPage() {
  const { logout } = useAuth();
  const { addToast, setNewMessages } = useAdminData();
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [needsPlugin, setNeedsPlugin] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/contact", { cache: "no-store" });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load messages.");
      setMessages(data.messages ?? []);
      setNeedsPlugin(!!data.needsPlugin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
      setMessages((m) => m ?? []);
    }
  }, [logout]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the sidebar badge in step with what's on screen.
  useEffect(() => {
    if (messages) setNewMessages(messages.filter((m) => m.status === "new").length);
  }, [messages, setNewMessages]);

  const counts = useMemo(() => {
    const list = messages ?? [];
    return {
      open: list.filter((m) => m.status !== "done").length,
      new: list.filter((m) => m.status === "new").length,
      done: list.filter((m) => m.status === "done").length,
      all: list.length,
    };
  }, [messages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (messages ?? []).filter((m) => {
      const inFilter =
        filter === "all" || (filter === "open" ? m.status !== "done" : m.status === filter);
      const hay = `${m.name} ${m.email ?? ""} ${m.phone ?? ""} ${m.message} ${m.reference}`.toLowerCase();
      return inFilter && (!q || hay.includes(q));
    });
  }, [messages, filter, query]);

  const open = (messages ?? []).find((m) => m.databaseId === openId) ?? null;

  const setStatus = useCallback(
    async (m: ContactMessage, status: ContactMessage["status"], quiet = false) => {
      const before = m.status;
      setMessages((list) => (list ?? []).map((x) => (x.databaseId === m.databaseId ? { ...x, status } : x)));
      try {
        const res = await fetch(`/api/contact/${m.databaseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.status === 401) return logout();
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not update the message.");
        if (!quiet) addToast(status === "done" ? "Marked as done" : status === "new" ? "Marked as unread" : "Marked as read");
      } catch (err) {
        setMessages((list) => (list ?? []).map((x) => (x.databaseId === m.databaseId ? { ...x, status: before } : x)));
        addToast(err instanceof Error ? err.message : "Could not update the message.", "danger");
      }
    },
    [addToast, logout],
  );

  // Opening a new message marks it read, like any inbox.
  const select = (m: ContactMessage) => {
    setOpenId(m.databaseId);
    if (m.status === "new") setStatus(m, "read", true);
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contact/${toDelete.databaseId}`, { method: "DELETE" });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not delete the message.");
      setMessages((list) => (list ?? []).filter((m) => m.databaseId !== toDelete.databaseId));
      if (openId === toDelete.databaseId) setOpenId(null);
      addToast("Message deleted");
      setToDelete(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not delete the message.", "danger");
    } finally {
      setDeleting(false);
    }
  };

  const closeDelete = useCallback(() => setToDelete(null), []);

  const replyHref = (m: ContactMessage) => {
    const subject = `Re: ${topicLabel(m.topic)} (${m.reference})`;
    const quoted = m.message.split("\n").map((l) => `> ${l}`).join("\n");
    const body = `Dear ${m.name.split(" ")[0] || m.name},\n\n\n\nKind regards,\n${SITE.name}\n\n---\n${quoted}`;
    return `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Sent through the contact form on the website"
        actions={
          <button type="button" className="ad-btn" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? "ad-spin" : ""} />Refresh
          </button>
        }
      />

      {needsPlugin && (
        <div className="ad-alert ad-tone-warn" role="status" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            WordPress needs the SECH Portal plugin version 1.5.0 before messages can be saved. Until then the contact
            form asks visitors to call the hospital instead.
          </span>
        </div>
      )}
      {error && (
        <div className="ad-alert ad-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
        </div>
      )}

      <div className="msg-layout" data-open={open ? "true" : undefined}>
        <section className="ad-card msg-list-card">
          <div className="msg-list-head">
            <Segmented
              id="messages"
              ariaLabel="Filter messages"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "open", label: "Open", count: counts.open },
                { value: "new", label: "Unread", count: counts.new },
                { value: "done", label: "Done", count: counts.done },
                { value: "all", label: "All", count: counts.all },
              ]}
            />
            <div className="ad-input-wrap">
              <Search size={15} />
              <input className="ad-input" placeholder="Search name, email, phone or text" value={query}
                onChange={(e) => setQuery(e.target.value)} aria-label="Search messages" />
            </div>
          </div>

          {messages === null ? (
            <SkeletonRows rows={6} cols={2} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={query ? "No matches" : filter === "done" ? "Nothing marked done yet" : "Inbox zero"}
              text={query ? "Try a different search." : "Messages from the website’s contact form appear here."}
            />
          ) : (
            <ul className="msg-list">
              {filtered.map((m) => (
                <li key={m.databaseId}>
                  <button
                    type="button"
                    className="msg-item"
                    data-active={m.databaseId === openId || undefined}
                    data-unread={m.status === "new" || undefined}
                    onClick={() => select(m)}
                  >
                    <Avatar name={m.name} size="sm" />
                    <span className="msg-item-main">
                      <span className="msg-item-top">
                        <span className="msg-item-name">{m.name}</span>
                        <span className="msg-item-when">{when(m.createdAt)}</span>
                      </span>
                      <span className="msg-item-topic">{topicLabel(m.topic)}{m.status === "done" && " · Done"}</span>
                      <span className="msg-item-snippet">{m.message}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ad-card msg-read" aria-live="polite">
          {!open ? (
            <EmptyState icon={MailOpen} title="Select a message" text="Pick a message on the left to read it here." />
          ) : (
            <article className="msg-article">
              <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm msg-back" onClick={() => setOpenId(null)}>
                <ArrowLeft size={15} />All messages
              </button>

              <header className="msg-read-head">
                <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                  <Avatar name={open.name} size="lg" />
                  <div style={{ minWidth: 0 }}>
                    <h2 className="msg-read-name">{open.name}</h2>
                    <div className="msg-read-meta">
                      {open.reference} · {new Date(open.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </div>
                </div>
                <Chip tone={TOPIC_TONE[open.topic] ?? "muted"}>{topicLabel(open.topic)}</Chip>
              </header>

              <dl className="msg-contact">
                {open.email && (
                  <div><dt><Mail size={14} />Email</dt><dd><a href={`mailto:${open.email}`}>{open.email}</a></dd></div>
                )}
                {open.phone && (
                  <div><dt><Phone size={14} />Phone</dt><dd><a href={`tel:${open.phone.replace(/\s+/g, "")}`}>{open.phone}</a></dd></div>
                )}
              </dl>

              {/* Plain text only: visitor-typed content is never rendered as HTML. */}
              <div className="msg-body">{open.message}</div>

              <div className="msg-actions">
                {open.email && (
                  <a className="ad-btn ad-btn--primary" href={replyHref(open)} onClick={() => open.status !== "done" && setStatus(open, "read", true)}>
                    <Mail size={15} />Reply by email
                  </a>
                )}
                {open.phone && (
                  <a className="ad-btn" href={`tel:${open.phone.replace(/\s+/g, "")}`}><Phone size={15} />Call</a>
                )}
                {open.status === "done" ? (
                  <button type="button" className="ad-btn" onClick={() => setStatus(open, "read")}><RotateCcw size={15} />Reopen</button>
                ) : (
                  <button type="button" className="ad-btn ad-btn--success-soft" onClick={() => setStatus(open, "done")}><CheckCheck size={15} />Mark done</button>
                )}
                {open.status !== "new" && open.status !== "done" && (
                  <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setStatus(open, "new")}><Mail size={15} />Mark unread</button>
                )}
                <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon" style={{ marginLeft: "auto" }}
                  onClick={() => setToDelete(open)} aria-label="Delete message" title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this message?"
        text={<>The message from <strong>{toDelete?.name}</strong> will be deleted for good. Mark it done instead if you might need it later.</>}
        confirmLabel="Delete"
        icon={Trash2}
        busy={deleting}
        onConfirm={doDelete}
        onCancel={closeDelete}
      />
    </>
  );
}
