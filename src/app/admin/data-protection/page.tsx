"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardList, Hourglass, KeyRound, Loader2, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { Card, Chip, EmptyState, PageHeader, SkeletonRows, type Tone } from "@/components/admin/ui";
import { AUDIT_ACTIONS, type StaffAuditEntry, type StaffDataProtection } from "@/lib/staff";

const RETENTION_CHOICES = [0, 2, 3, 5, 6, 7, 10, 15];

const ACTION_TONE: Record<string, Tone> = {
  deleted: "danger",
  exported: "warn",
  anonymised: "info",
  settings: "info",
  created: "success",
  updated: "brand",
};

function when(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DataProtectionPage() {
  const { logout } = useAuth();
  const { addToast } = useAdminData();
  const [status, setStatus] = useState<StaffDataProtection | null>(null);
  const [audit, setAudit] = useState<StaffAuditEntry[]>([]);
  const [needsPlugin, setNeedsPlugin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [years, setYears] = useState(0);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/staff/data-protection", { cache: "no-store" });
      if (res.status === 401) return logout();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not load the data protection details.");
      setNeedsPlugin(!!data.needsPlugin);
      setStatus(data.status);
      setYears(data.status?.retentionYears ?? 0);
      setAudit(data.audit ?? []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the data protection details.");
    } finally {
      setLoaded(true);
    }
  }, [logout]);

  useEffect(() => { load(); }, [load]);

  const saveRetention = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/staff/data-protection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ years }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save the retention period.");
      addToast(years ? `Retention period set to ${years} years after leaving` : "Retention clean-up turned off");
      await load();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Could not save the retention period.", "danger");
    } finally {
      setSaving(false);
    }
  };

  const shown = useMemo(() => (filter === "all" ? audit : audit.filter((a) => a.action === filter)), [audit, filter]);
  const actions = useMemo(() => Array.from(new Set(audit.map((a) => a.action))), [audit]);

  const encryption = status?.encryption;
  const encTone: Tone = encryption === "dedicated" ? "success" : encryption === "site" ? "info" : "danger";
  const encLabel = encryption === "dedicated" ? "Encrypted, dedicated key" : encryption === "site" ? "Encrypted, site keys" : "Not encrypted";

  return (
    <>
      <PageHeader
        title="Data protection"
        subtitle="Staff records under the Data Protection Act, 2012 (Act 843)"
        actions={
          <>
            <Link href="/admin/employees" className="po-btn"><UsersRound size={15} />Employees</Link>
            <button type="button" className="po-btn" onClick={load}><RefreshCw size={15} />Refresh</button>
          </>
        }
      />

      {error && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0 }} /><span>{error}</span>
        </div>
      )}

      {needsPlugin ? (
        <div className="po-alert po-tone-warn" role="note">
          <AlertTriangle size={17} style={{ flexShrink: 0 }} />
          <span>Install SECH Portal plugin 1.10.0 on WordPress to turn on encryption, the activity log and the retention clean-up.</span>
        </div>
      ) : (
        <>
          <div className="dp-grid">
            <Card title="Payroll and licence identifiers" icon={KeyRound}>
              {!loaded ? <SkeletonRows rows={2} cols={1} /> : (
                <>
                  <p style={{ margin: "0 0 10px" }}><Chip tone={encTone}>{encLabel}</Chip></p>
                  <p className="po-hint" style={{ margin: 0 }}>
                    SSNIT numbers, CAGD staff IDs and licence PINs are stored encrypted, so a copy of the database alone does not reveal them.
                    {encryption === "site" && " They use the website’s own secret keys. For a separate key, the web host can add SECH_DATA_KEY to wp-config.php."}
                    {encryption === "off" && " The web server is missing the sodium extension. Ask the web host to enable it."}
                  </p>
                </>
              )}
            </Card>

            <Card title="Retention after leaving" icon={Hourglass}>
              {!loaded ? <SkeletonRows rows={2} cols={1} /> : (
                <>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                    <select className="po-select" value={years} onChange={(e) => setYears(Number(e.target.value))} aria-label="Retention period" style={{ maxWidth: 260 }}>
                      {RETENTION_CHOICES.map((y) => (
                        <option key={y} value={y}>{y ? `${y} years after leaving` : "Keep (clean-up off)"}</option>
                      ))}
                    </select>
                    <button type="button" className="po-btn po-btn--primary" onClick={saveRetention} disabled={saving || years === (status?.retentionYears ?? 0)}>
                      {saving ? <Loader2 size={15} className="po-spin" /> : null}Save
                    </button>
                  </div>
                  <p className="po-hint" style={{ margin: 0 }}>
                    Once a day, staff who left longer ago than this lose their contact details, payroll and licence IDs and notes.
                    Their name, staff number, posting and dates of service stay for references and pensions.
                    {status?.retentionYears && status.dueForCleanup
                      ? ` ${status.dueForCleanup} record${status.dueForCleanup === 1 ? " is" : "s are"} due at the next clean-up.`
                      : ""}
                  </p>
                </>
              )}
            </Card>
          </div>

          <Card
            title="Activity log"
            icon={ClipboardList}
            subtitle={`Who opened, changed, exported or removed staff records. Kept for ${status?.auditKeepYears ?? 3} years; it cannot be edited.`}
            action={actions.length > 1 ? (
              <select className="po-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter the log" style={{ width: "auto" }}>
                <option value="all">Everything</option>
                {actions.map((a) => <option key={a} value={a}>{AUDIT_ACTIONS[a] ?? a}</option>)}
              </select>
            ) : undefined}
            bodyClassName=""
            style={{ marginTop: 16 }}
          >
            {!loaded ? (
              <div style={{ padding: 18 }}><SkeletonRows rows={6} cols={4} /></div>
            ) : shown.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="Nothing logged yet" text="Activity on staff records will appear here." />
            ) : (
              <div className="po-table-wrap">
                <table className="po-table">
                  <thead>
                    <tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Details</th></tr>
                  </thead>
                  <tbody>
                    {shown.map((a) => (
                      <tr key={a.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{when(a.at)}</td>
                        <td className="po-cell-main">{a.userName}</td>
                        <td><Chip tone={ACTION_TONE[a.action] ?? "muted"}>{AUDIT_ACTIONS[a.action] ?? a.action}</Chip></td>
                        <td>{a.employeeName || "All records"}</td>
                        <td>{a.detail}</td>
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
