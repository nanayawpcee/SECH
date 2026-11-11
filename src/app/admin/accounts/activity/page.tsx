"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ClipboardList, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, Chip, EmptyState, PageHeader, SkeletonRows, type Tone } from "@/components/admin/ui";
import { can } from "@/lib/permissions";
import { ACC_AUDIT_ACTIONS, type AccAuditEntry } from "@/lib/accounts";

const TONE: Record<string, Tone> = { voided: "danger", exported: "warn", reprinted: "warn", recorded: "success", housing_types: "info" };

export default function AccountsActivityPage() {
  const { admin, logout } = useAuth();
  const allowed = can(admin?.perms, "settings");
  const [entries, setEntries] = useState<AccAuditEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/accounts/audit", { cache: "no-store" });
    if (res.status === 401) return logout();
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error || "Could not load the activity log.");
    else { setEntries(data.entries); setError(""); }
    setLoaded(true);
  }, [logout]);

  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  const actions = useMemo(() => Array.from(new Set(entries.map((e) => e.action))), [entries]);
  const shown = filter === "all" ? entries : entries.filter((e) => e.action === filter);

  return (
    <>
      <PageHeader
        title="Accounts activity log"
        subtitle="Every receipt, void, print, export and change in the accounts office. It can't be edited."
        actions={
          <>
            <Link href="/admin/accounts" className="po-btn"><ArrowLeft size={15} />Accounts</Link>
            {allowed && <button type="button" className="po-btn" onClick={load}><RefreshCw size={15} />Refresh</button>}
          </>
        }
      />
      {!allowed ? (
        <EmptyState icon={ClipboardList} title="Administrators only" text="The accounts activity log is kept for administrators." />
      ) : (
        <>
          {error && (
            <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
              <AlertTriangle size={17} style={{ flexShrink: 0 }} /><span>{error}</span>
            </div>
          )}
          <Card
            title="Activity"
            icon={ClipboardList}
            bodyClassName=""
            action={actions.length > 1 ? (
              <select className="po-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" style={{ width: "auto" }}>
                <option value="all">Everything</option>
                {actions.map((a) => <option key={a} value={a}>{ACC_AUDIT_ACTIONS[a] ?? a}</option>)}
              </select>
            ) : undefined}
          >
            {!loaded ? <div style={{ padding: 18 }}><SkeletonRows rows={6} cols={4} /></div>
              : shown.length === 0 ? <EmptyState icon={ClipboardList} title="Nothing logged yet" text="Activity in the accounts office will appear here." />
              : (
                <div className="po-table-wrap">
                  <table className="po-table">
                    <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Receipt</th><th>Details</th></tr></thead>
                    <tbody>
                      {shown.map((e) => (
                        <tr key={e.id}>
                          <td style={{ whiteSpace: "nowrap" }}>{new Date(e.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                          <td className="po-cell-main">{e.userName}</td>
                          <td><Chip tone={TONE[e.action] ?? "muted"}>{ACC_AUDIT_ACTIONS[e.action] ?? e.action}</Chip></td>
                          <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}>{e.ref}</td>
                          <td>{e.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Card>
        </>
      )}
    </>
  );
}
