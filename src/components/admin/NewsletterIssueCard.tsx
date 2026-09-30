"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, FileText, Loader2, RefreshCw, Replace, Upload, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { Card, ConfirmDialog, Skeleton } from "@/components/admin/ui";
import { formatBytes, type NewsletterIssue, type NewsletterPdf } from "@/lib/wp-newsletter";

/** Uploads pass through the website's server, which Vercel caps at ~4.5 MB. */
const MAX_UPLOAD = 4 * 1024 * 1024;
const DEFAULT_TITLE = "St. Elizabeth Catholic Hospital Newsletter";

function day(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
}

/**
 * Which PDF the website footer offers as "Read the latest newsletter".
 * Small files upload here; bigger ones go through the WordPress Media Library
 * (no size cap there) and are then picked from the list.
 */
export function NewsletterIssueCard() {
  const { logout } = useAuth();
  const { addToast } = useAdminData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [needsPlugin, setNeedsPlugin] = useState(false);
  const [current, setCurrent] = useState<NewsletterIssue | null>(null);
  const [pdfs, setPdfs] = useState<NewsletterPdf[]>([]);
  const [editing, setEditing] = useState(false);
  const [pick, setPick] = useState<number | "">("");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [issue, setIssue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tooBig, setTooBig] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/newsletter/issue", { cache: "no-store" });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load the newsletter issue.");
      setCurrent(data.current ?? null);
      setPdfs(data.pdfs ?? []);
      setNeedsPlugin(!!data.needsPlugin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the newsletter issue.");
    } finally {
      setLoaded(true);
    }
  }, [logout]);

  useEffect(() => {
    load();
  }, [load]);

  const startEditing = () => {
    setPick(current?.attachmentId ?? "");
    setTitle(current?.title || DEFAULT_TITLE);
    setIssue(current?.issue ?? "");
    setError("");
    setTooBig(false);
    setEditing(true);
  };

  const upload = async (file: File) => {
    setError("");
    setTooBig(false);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("That isn’t a PDF. Please choose the newsletter’s PDF file.");
      return;
    }
    if (file.size > MAX_UPLOAD) {
      setTooBig(true);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      const res = await fetch("/api/media", { method: "POST", body: form });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) throw new Error(data.error || "The upload didn’t go through.");
      const row: NewsletterPdf = {
        attachmentId: data.id,
        fileName: file.name,
        title: file.name.replace(/\.pdf$/i, ""),
        url: data.url,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
      };
      setPdfs((list) => [row, ...list.filter((p) => p.attachmentId !== row.attachmentId)]);
      setPick(row.attachmentId);
      addToast("PDF uploaded. Add a title and save to publish it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The upload didn’t go through.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!pick) return setError("Upload a PDF or choose one from the list.");
    if (!title.trim()) return setError("Give the newsletter a title.");
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/issue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId: pick, title, issue }),
      });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setCurrent(data.current);
      setEditing(false);
      addToast("The website now offers this newsletter for download");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/newsletter/issue", { method: "DELETE" });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove it.");
      setCurrent(null);
      setConfirmClear(false);
      addToast("The download link has been taken off the website");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Could not remove it.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const closeConfirm = useCallback(() => setConfirmClear(false), []);

  return (
    <Card
      title="Downloadable issue"
      subtitle="Offered in the website footer as “Read the latest newsletter”"
      icon={FileText}
      style={{ marginBottom: 16 }}
    >
      {!loaded ? (
        <Skeleton h={56} />
      ) : needsPlugin ? (
        <div className="ad-alert ad-tone-warn" role="status">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>WordPress needs the SECH Portal plugin version 1.6.0 before a newsletter can be offered for download.</span>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {!editing && (
            current ? (
              <div className="nli-current">
                <span className="nli-icon"><FileText size={22} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ad-cell-main">{current.title}</div>
                  <div className="ad-cell-sub">
                    {[current.issue, "PDF", formatBytes(current.sizeBytes), current.updatedAt && `set ${day(current.updatedAt)}`].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="nli-actions">
                  <a className="ad-btn ad-btn--sm" href={current.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Open</a>
                  <button type="button" className="ad-btn ad-btn--sm ad-btn--primary" onClick={startEditing}><Replace size={14} />Replace</button>
                  <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost" onClick={() => setConfirmClear(true)}><XCircle size={14} />Remove link</button>
                </div>
              </div>
            ) : (
              <div className="nli-current">
                <span className="nli-icon" data-empty><FileText size={22} /></span>
                <div style={{ flex: 1 }}>
                  <div className="ad-cell-main">No newsletter offered yet</div>
                  <div className="ad-cell-sub">Upload the latest issue and the footer shows a download link.</div>
                </div>
                <button type="button" className="ad-btn ad-btn--primary" onClick={startEditing}><Upload size={15} />Add newsletter</button>
              </div>
            )
          )}

          {editing && (
            <div className="nli-editor">
              <div className="nli-row">
                <div className="ad-field" style={{ flex: "1 1 260px" }}>
                  <span className="ad-label">PDF file</span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select className="ad-select" style={{ flex: "1 1 220px" }} value={pick}
                      onChange={(e) => setPick(e.target.value ? Number(e.target.value) : "")} aria-label="Choose a PDF">
                      <option value="">Choose a PDF…</option>
                      {pdfs.map((p) => (
                        <option key={p.attachmentId} value={p.attachmentId}>
                          {p.fileName || p.title} ({formatBytes(p.sizeBytes) || "PDF"}, {day(p.uploadedAt)})
                        </option>
                      ))}
                    </select>
                    <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden
                      onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                    <button type="button" className="ad-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <><Loader2 size={15} className="ad-spin" />Uploading…</> : <><Upload size={15} />Upload PDF</>}
                    </button>
                  </div>
                  <span className="ad-hint">Up to 4 MB here. Compress bigger files first, or use the Media Library.</span>
                </div>
              </div>

              {tooBig && (
                <div className="ad-alert ad-tone-warn" role="alert">
                  <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    That file is over 4 MB, too big to upload here. Either save a smaller version (for example with
                    “Reduce file size” in your PDF app), or upload it in the{" "}
                    <a href="/wp-admin/media-new.php" target="_blank" rel="noopener noreferrer"><strong>WordPress Media Library</strong></a>,
                    then press{" "}
                    <button type="button" className="ad-btn ad-btn--sm" onClick={() => { setTooBig(false); load(); }}>
                      <RefreshCw size={13} />Refresh list
                    </button>{" "}
                    and choose it above.
                  </span>
                </div>
              )}

              <div className="nli-row">
                <label className="ad-field" style={{ flex: "2 1 260px" }}>
                  <span className="ad-label">Title</span>
                  <input className="ad-input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <label className="ad-field" style={{ flex: "1 1 200px" }}>
                  <span className="ad-label">Issue (optional)</span>
                  <input className="ad-input" value={issue} maxLength={80} placeholder="e.g. Maiden edition, November 2022"
                    onChange={(e) => setIssue(e.target.value)} />
                </label>
              </div>

              {error && (
                <div className="ad-alert ad-tone-danger" role="alert">
                  <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                <button type="button" className="ad-btn ad-btn--primary" onClick={save} disabled={saving || uploading || !pick}>
                  {saving ? <><Loader2 size={15} className="ad-spin" />Saving…</> : "Save and publish"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Remove the download link?"
        text="The footer stops offering the newsletter. The PDF stays in the Media Library, so you can bring it back later."
        confirmLabel="Remove link"
        icon={XCircle}
        busy={saving}
        onConfirm={clear}
        onCancel={closeConfirm}
      />
    </Card>
  );
}
