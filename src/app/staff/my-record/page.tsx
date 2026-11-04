"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Briefcase, Eye, EyeOff, IdCard, Info, KeyRound, Phone, StickyNote, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, EmptyState, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { employmentLabel, formatDate, statusLabel, type MyStaffRecord } from "@/lib/staff";

function Masked({ value }: { value: string | null }) {
  const [shown, setShown] = useState(false);
  if (!value) return <>Not recorded</>;
  const masked = value.length > 4 ? `${"•".repeat(Math.min(8, value.length - 4))}${value.slice(-4)}` : value;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "ui-monospace, monospace" }}>{shown ? value : masked}</span>
      <button type="button" className="po-btn po-btn--sm po-btn--ghost" onClick={() => setShown((s) => !s)} aria-pressed={shown}>
        {shown ? <EyeOff size={14} /> : <Eye size={14} />}{shown ? "Hide" : "Show"}
      </button>
    </span>
  );
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="mr-rows">
      {rows.map(([label, value]) => (
        <div key={label} className="mr-row">
          <dt>{label}</dt>
          <dd>{value || <span style={{ color: "var(--po-text-3)" }}>Not recorded</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function MyStaffRecordPage() {
  const { logout } = useAuth();
  const [record, setRecord] = useState<MyStaffRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [needsPlugin, setNeedsPlugin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/staff/me", { cache: "no-store" });
        if (res.status === 401) return logout();
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not load your record.");
        setRecord(data.record);
        setNeedsPlugin(!!data.needsPlugin);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load your record.");
      } finally {
        setLoaded(true);
      }
    })();
  }, [logout]);

  const r = record;
  const name = r ? [r.title, r.firstName, r.otherNames, r.lastName].filter(Boolean).join(" ") : "";

  return (
    <>
      <PageHeader title="My staff record" subtitle="What the hospital holds about you in the staff portal" />

      <div className="po-alert po-tone-info" role="note" style={{ marginBottom: 16 }}>
        <Info size={17} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          This is the information the hospital keeps about you for staff administration, payroll and professional licensing.
          If anything is wrong or out of date, ask the HR office to correct it.
        </span>
      </div>

      {error && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0 }} /><span>{error}</span>
        </div>
      )}

      {!loaded ? (
        <Card><SkeletonRows rows={6} cols={2} /></Card>
      ) : needsPlugin ? (
        <EmptyState icon={IdCard} title="Not available yet" text="This page needs the latest version of the portal on the hospital’s WordPress site." />
      ) : !r ? (
        <EmptyState
          icon={IdCard}
          title="No staff record is linked to your account"
          text="If you work at the hospital, ask the HR office to link your staff record to your portal account."
        />
      ) : (
        <div className="mr-grid">
          <Card title="Personal" icon={UserRound}>
            <Rows rows={[
              ["Name", name],
              ["Gender", r.gender ? r.gender[0].toUpperCase() + r.gender.slice(1) : null],
              ["Staff number", r.staffNumber],
            ]} />
          </Card>
          <Card title="Employment" icon={Briefcase}>
            <Rows rows={[
              ["Department", [r.department, r.unit].filter(Boolean).join(", ")],
              ["Cadre and rank", [r.cadre, r.rank].filter(Boolean).join(", ")],
              ["Management position", r.position],
              ["Employment type", employmentLabel(r.employmentType)],
              ["Status", statusLabel(r.status)],
              ["First appointment", formatDate(r.dateFirstAppointment)],
              ["Current rank since", formatDate(r.dateCurrentRank)],
            ]} />
          </Card>
          <Card title="Contact" icon={Phone}>
            <Rows rows={[["Phone", r.phone], ["Email", r.email]]} />
          </Card>
          <Card title="Professional licence" icon={KeyRound}>
            <Rows rows={[
              ["Council", r.licenceBody],
              ["Licence PIN", r.licencePin ? <Masked value={r.licencePin} /> : null],
              ["Expiry", formatDate(r.licenceExpiry)],
            ]} />
          </Card>
          <Card title="Payroll" icon={IdCard}>
            <Rows rows={[
              ["CAGD staff ID", r.cagdStaffId ? <Masked value={r.cagdStaffId} /> : null],
              ["SSNIT", r.ssnit ? <Masked value={r.ssnit} /> : null],
            ]} />
          </Card>
          <Card title="Notes" icon={StickyNote}>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.notes || <span style={{ color: "var(--po-text-3)" }}>None</span>}</p>
          </Card>
        </div>
      )}
    </>
  );
}
