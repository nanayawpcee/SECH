"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Copy,
  Download,
  Mail,
  MailCheck,
  MailX,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { Chip, ConfirmDialog, EmptyState, PageHeader, SkeletonRows, type Tone } from "@/components/admin/ui";
import { NewsletterIssueCard } from "@/components/admin/NewsletterIssueCard";
import { downloadCsv } from "@/lib/csv";
import { keyOfTimestamp, todayKey } from "@/lib/admin-dates";
import { SITE } from "@/lib/data";
import type { NewsletterSubscriber } from "@/lib/wp-newsletter";

type Filter = "all" | NewsletterSubscriber["status"];

const unsubscribeLink = (s: NewsletterSubscriber) =>
  `${SITE.url}/newsletter/unsubscribe?token=${encodeURIComponent(s.unsubscribeToken)}`;

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The footer sign-up list. Administrators only — it is personal data. */
export default function NewsletterPage() {
  const { logout } = useAuth();
  const { addToast } = useAdminData();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[] | null>(null);
  const [needsPlugin, setNeedsPlugin] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("subscribed");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<NewsletterSubscriber | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/newsletter", { cache: "no-store" });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load subscribers.");
      setSubscribers(data.subscribers ?? []);
      setNeedsPlugin(!!data.needsPlugin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load subscribers.");
      setSubscribers((s) => s ?? []);
    }
  }, [logout]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const list = subscribers ?? [];
    return {
      all: list.length,
      subscribed: list.filter((s) => s.status === "subscribed").length,
      unsubscribed: list.filter((s) => s.status === "unsubscribed").length,
    };
  }, [subscribers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (subscribers ?? []).filter(
      (s) =>
        (filter === "all" || s.status === filter) &&
        (!q || s.email.toLowerCase().includes(q) || (s.name ?? "").toLowerCase().includes(q)),
    );
  }, [subscribers, filter, query]);

  // Only ever export or copy people who are still subscribed — a mailing
  // made from this list must never reach someone who left it.
  const mailable = filtered.filter((s) => s.status === "subscribed");

  const exportCSV = () => {
    downloadCsv(
      `sech-newsletter-${todayKey()}.csv`,
      ["Email", "Name", "Subscribed", "Unsubscribe link"],
      mailable.map((s) => [s.email, s.name ?? "", keyOfTimestamp(s.subscribedAt ?? ""), unsubscribeLink(s)]),
    );
    addToast(`Exported ${mailable.length} subscriber${mailable.length === 1 ? "" : "s"}`);
  };

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(mailable.map((s) => s.email).join(", "));
      addToast(`Copied ${mailable.length} address${mailable.length === 1 ? "" : "es"}. Paste them into BCC, never To or CC.`);
    } catch {
      addToast("Your browser blocked copying. Use Export instead.", "warn");
    }
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
      const res = await fetch(`/api/newsletter/${toDelete.databaseId}`, { method: "DELETE" });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove the subscriber.");
      setSubscribers((list) => (list ?? []).filter((s) => s.databaseId !== toDelete.databaseId));
      addToast(`Erased ${toDelete.email}`);
      setToDelete(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not remove the subscriber.", "danger");
    } finally {
      setDeleting(false);
    }
  };

  const closeDelete = useCallback(() => setToDelete(null), []);

  // For someone who emails asking to be taken off: same route as their own
  // unsubscribe link, so the record is kept as "unsubscribed" and can't be
  // mailed from a later export.
  const unsubscribe = async (s: NewsletterSubscriber) => {
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: s.unsubscribeToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not unsubscribe them.");
      const now = new Date().toISOString();
      setSubscribers((list) =>
        (list ?? []).map((x) => (x.databaseId === s.databaseId ? { ...x, status: "unsubscribed", unsubscribedAt: now } : x)),
      );
      addToast(`Unsubscribed ${s.email}`);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not unsubscribe them.", "danger");
    }
  };

  const TILES: { key: Filter; label: string; icon: typeof Users; tone: Tone }[] = [
    { key: "subscribed", label: "Subscribed", icon: MailCheck, tone: "success" },
    { key: "unsubscribed", label: "Unsubscribed", icon: MailX, tone: "muted" },
    { key: "all", label: "Everyone", icon: Users, tone: "brand" },
  ];

  return (
    <>
      <PageHeader
        title="Newsletter"
        subtitle="People who signed up from the website footer"
        actions={
          <>
            <button type="button" className="ad-btn" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "ad-spin" : ""} />Refresh
            </button>
            <button type="button" className="ad-btn" onClick={copyEmails} disabled={!mailable.length}>
              <Copy size={15} />Copy emails
            </button>
            <button type="button" className="ad-btn ad-btn--primary" onClick={exportCSV} disabled={!mailable.length}>
              <Download size={15} />Export mailing list
            </button>
          </>
        }
      />

      {needsPlugin && (
        <div className="ad-alert ad-tone-warn" role="status" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            WordPress needs the SECH Portal plugin version 1.4.0 before sign-ups can be saved. Until then the footer
            form will tell visitors to try again later.
          </span>
        </div>
      )}
      {error && (
        <div className="ad-alert ad-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
        </div>
      )}

      <NewsletterIssueCard />

      <div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 16 }}>
        {TILES.map((t) => {
          const Icon = t.icon;
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`ad-card ad-card--hover ad-kpi ad-tone-${t.tone} ad-bk-tile`}
              data-active={active}
              aria-pressed={active}
              onClick={() => setFilter(t.key)}
            >
              <div className="ad-kpi-top">
                <span className="ad-kpi-label">{t.label}</span>
                <span className="ad-kpi-icon"><Icon size={17} /></span>
              </div>
              <div className="ad-kpi-value">{counts[t.key]}</div>
            </button>
          );
        })}
      </div>

      <section className="ad-card">
        <div className="ad-toolbar">
          <div className="ad-input-wrap" style={{ flex: "1 1 240px", maxWidth: 340 }}>
            <Search size={15} />
            <input className="ad-input" placeholder="Search email or name" value={query}
              onChange={(e) => setQuery(e.target.value)} aria-label="Search subscribers" />
          </div>
          <p className="ad-hint" style={{ margin: 0, marginLeft: "auto" }}>
            Exports include each person’s unsubscribe link. Put it at the bottom of every email.
          </p>
        </div>

        {subscribers === null ? (
          <SkeletonRows rows={5} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Mail}
            title={query ? "No matches" : filter === "unsubscribed" ? "Nobody has unsubscribed" : "No subscribers yet"}
            text={query ? "Try a different search." : "Sign-ups from the newsletter form at the bottom of every page appear here."}
          />
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Signed up</th>
                  <th>Left</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.databaseId}>
                    <td>
                      <div className="ad-cell-main">{s.email}</div>
                      {s.name && <div className="ad-cell-sub">{s.name}</div>}
                    </td>
                    <td>
                      <Chip tone={s.status === "subscribed" ? "success" : "muted"}>
                        {s.status === "subscribed" ? "Subscribed" : "Unsubscribed"}
                      </Chip>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(s.subscribedAt)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDate(s.unsubscribedAt)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {s.status === "subscribed" && (
                        <button type="button" className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => unsubscribe(s)}
                          title="Stop sending them emails">
                          <MailX size={15} />Unsubscribe
                        </button>
                      )}
                      <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon ad-btn--sm"
                        onClick={() => setToDelete(s)} aria-label={`Erase ${s.email}`} title="Erase completely">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!toDelete}
        title="Erase this subscriber?"
        text={
          <>
            <strong>{toDelete?.email}</strong> will be removed completely, with no record kept. Use this when someone
            asks for their data to be deleted. If they only want to stop receiving emails, use Unsubscribe instead.
          </>
        }
        confirmLabel="Erase"
        icon={Trash2}
        busy={deleting}
        onConfirm={doDelete}
        onCancel={closeDelete}
      />
    </>
  );
}
