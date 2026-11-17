"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Briefcase, GraduationCap, HeartHandshake, House, IdCard, Info, KeyRound, Phone, Siren, StickyNote, UserRound, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, EmptyState, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { RevealValue } from "@/components/admin/RevealPin";
import {
  MARITAL_STATUSES,
  WORK_PATTERNS,
  employmentLabel,
  formatDate,
  parseList,
  statusLabel,
  type ChildRow,
  type EducationRow,
  type MyStaffRecord,
  type WorkRow,
} from "@/lib/staff";

/** "Kofi Mensah (deceased)", or just "Deceased" when only that is recorded */
const parent = (name: string | null | undefined, state: string | null | undefined) =>
  state === "deceased" ? (name ? `${name} (deceased)` : "Deceased") : name || null;
const cap = (v: string | null | undefined) => (v ? v[0].toUpperCase() + v.slice(1) : null);
const labelOf = (list: readonly { value: string; label: string }[], v: string | null | undefined) =>
  list.find((x) => x.value === v)?.label ?? (v || null);

/** A short table for the repeating parts: children, schools, past jobs */
function MiniTable({ head, rows, empty }: { head: string[]; rows: (string | null)[][]; empty: string }) {
  if (!rows.length) return <p className="po-hint" style={{ margin: 0 }}>{empty}</p>;
  return (
    <div className="mr-table-wrap">
      <table className="mr-table">
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c || "–"}</td>)}</tr>)}</tbody>
      </table>
    </div>
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
          If anything is wrong or out of date, ask the HR office to correct it. Numbers like SSNIT and your Ghana Card are hidden: showing one asks for your reveal PIN.
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
        <EmptyState art="documents" icon={IdCard} title="Not available yet" text="This page needs the latest version of the portal on the hospital’s WordPress site." />
      ) : !r ? (
        <EmptyState art="team"
          icon={IdCard}
          title="No staff record is linked to your account"
          text="If you work at the hospital, ask the HR office to link your staff record to your portal account."
        />
      ) : (
        <div className="mr-grid">
          <Card title="Personal" icon={UserRound}>
            <Rows rows={[
              ["Name", name],
              ["Gender", cap(r.gender)],
              ["Date of birth", formatDate(r.dateOfBirth ?? null)],
              ["Nationality", r.nationality],
              ["Ghana Card", r.ghanaCard ? <RevealValue masked={r.ghanaCard} field="ghanaCard" label="Ghana Card" /> : null],
              ["Religious denomination", r.religion],
              ["Staff number", r.staffNumber],
            ]} />
          </Card>
          <Card title="Hometown and addresses" icon={House}>
            <Rows rows={[
              ["Hometown", [r.hometown, r.hometownDistrict, r.hometownRegion].filter(Boolean).join(", ")],
              ["Permanent home address", r.homeAddress],
              ["GPS address", r.gpsAddress],
              ["Residential address", r.residentialAddress],
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
              ["Employment status", labelOf(WORK_PATTERNS, r.workPattern)],
              ["Date ending", formatDate(r.dateEnding ?? null)],
            ]} />
          </Card>
          <Card title="Contact" icon={Phone}>
            <Rows rows={[["Phone", r.phone], ["Email", r.email]]} />
          </Card>
          <Card title="Family" icon={Users}>
            <Rows rows={[
              ["Marital status", labelOf(MARITAL_STATUSES, r.maritalStatus)],
              ...(r.spouseName ? [["Spouse", r.spouseName] as [string, React.ReactNode]] : []),
              ["Father", parent(r.fatherName, r.fatherAlive)],
              ["Mother", parent(r.motherName, r.motherAlive)],
            ]} />
            <div className="mr-sub">Children</div>
            <MiniTable head={["Name", "Sex", "Date of birth"]} empty="None recorded."
              rows={parseList<ChildRow>(r.children ?? null).map((c) => [c.name, cap(c.sex), formatDate(c.dob || null)])} />
          </Card>
          <Card title="Next of kin" icon={HeartHandshake}>
            <Rows rows={[
              ["Name", [r.nextOfKinName, r.nextOfKinRelationship ? `(${r.nextOfKinRelationship})` : null].filter(Boolean).join(" ")],
              ["Phone", [r.nextOfKinPhone, r.nextOfKinAltPhone].filter(Boolean).join(", ")],
              ["Email", r.nextOfKinEmail],
              ["Address", r.nextOfKinAddress],
            ]} />
          </Card>
          <Card title="In case of emergency" icon={Siren}>
            <Rows rows={[["Name", r.emergencyName], ["Phone", r.emergencyPhone], ["Address", r.emergencyAddress]]} />
          </Card>
          <Card title="Education and work history" icon={GraduationCap}>
            <div className="mr-sub" style={{ marginTop: 0 }}>Education</div>
            <MiniTable head={["School", "Year", "Certificate"]} empty="None recorded."
              rows={parseList<EducationRow>(r.education ?? null).map((e) => [e.institution, e.year, e.certificate])} />
            <div className="mr-sub">Previous work</div>
            <MiniTable head={["Organisation", "Year", "Position"]} empty="None recorded."
              rows={parseList<WorkRow>(r.workHistory ?? null).map((w) => [w.organisation, w.year, w.position])} />
          </Card>
          <Card title="Professional licence" icon={KeyRound}>
            <Rows rows={[
              ["Council", r.licenceBody],
              ["Licence PIN", r.licencePin ? <RevealValue masked={r.licencePin} field="licencePin" label="licence PIN" /> : null],
              ["Expiry", formatDate(r.licenceExpiry)],
            ]} />
          </Card>
          <Card title="Payroll" icon={IdCard}>
            <Rows rows={[
              ["CAGD staff ID", r.cagdStaffId ? <RevealValue masked={r.cagdStaffId} field="cagdStaffId" label="CAGD staff ID" /> : null],
              ["SSNIT", r.ssnit ? <RevealValue masked={r.ssnit} field="ssnit" label="SSNIT number" /> : null],
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
