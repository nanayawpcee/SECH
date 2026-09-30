"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  Download,
  IdCard,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { Avatar, Chip, ConfirmDialog, EmptyState, PageHeader, SkeletonRows, type Tone } from "@/components/admin/ui";
import { EmployeeEditor } from "@/components/admin/staff/EmployeeEditor";
import { useStaff } from "@/components/admin/staff/useStaff";
import { downloadCsv } from "@/lib/csv";
import { todayKey } from "@/lib/admin-dates";
import {
  STATUSES,
  employmentLabel,
  formatDate,
  fullName,
  isTemporary,
  licenceState,
  statusLabel,
  type Employee,
} from "@/lib/staff";

type Focus = "all" | "temporary" | "licence" | "payroll";

const STATUS_TONE: Record<string, Tone> = { active: "success", on_leave: "warn", study_leave: "info", seconded: "violet", exited: "muted" };

/** Staff records: who works here, where, and at what rank. Administrators and HR officers. */
export default function EmployeesPage() {
  const { addToast } = useAdminData();
  const staff = useStaff();
  const { setup, employees, index } = staff;
  const [focus, setFocus] = useState<Focus>("all");
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("all");
  const [cadre, setCadre] = useState("all");
  const [status, setStatus] = useState("current");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // "In-charge, Male Ward" and friends, per person, from the structure.
  const roles = useMemo(() => {
    const out = new Map<number, string[]>();
    const add = (id: number, label: string) => id && out.set(id, [...(out.get(id) ?? []), label]);
    for (const d of setup?.structure.departments ?? []) {
      add(d.inchargeId, `Head, ${d.name}`);
      for (const u of d.units) {
        add(u.inchargeId, `In-charge, ${u.name}`);
        add(u.deputyId, `Deputy, ${u.name}`);
      }
    }
    return out;
  }, [setup]);

  const current = employees.filter((e) => e.status !== "exited");
  const needsLicence = (e: Employee) => {
    const s = licenceState(e.licenceExpiry);
    return e.status !== "exited" && (s === "expired" || s === "soon");
  };
  const needsPayroll = (e: Employee) =>
    e.status !== "exited" && !isTemporary(e.employmentType) && !e.cagdStaffId;

  const counts = {
    all: current.length,
    temporary: current.filter((e) => isTemporary(e.employmentType)).length,
    licence: employees.filter(needsLicence).length,
    payroll: employees.filter(needsPayroll).length,
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (focus === "temporary" && !isTemporary(e.employmentType)) return false;
      if (focus === "licence" && !needsLicence(e)) return false;
      if (focus === "payroll" && !needsPayroll(e)) return false;
      if (status === "current" ? e.status === "exited" : status !== "all" && e.status !== status) return false;
      if (dept !== "all" && e.departmentId !== dept) return false;
      if (cadre !== "all" && e.cadreId !== cadre) return false;
      if (!q) return true;
      const hay = [fullName(e, true), e.staffNumber, e.phone, e.email, e.licencePin, e.cagdStaffId,
        index.ranks.get(e.rankId ?? "")?.name, index.units.get(e.unitId ?? "")?.name].join(" ").toLowerCase();
      return hay.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, focus, query, dept, cadre, status, index]);

  const filtersOn = focus !== "all" || !!query || dept !== "all" || cadre !== "all" || status !== "current";
  const clearFilters = () => { setFocus("all"); setQuery(""); setDept("all"); setCadre("all"); setStatus("current"); };

  const closeEditor = useCallback(() => { setEditing(null); setCreating(false); }, []);

  const onSave = async (input: Partial<Employee>, id?: number) => {
    const r = await staff.saveEmployee(input, id);
    if (!r.ok) return r.error;
    addToast(id ? `Saved ${fullName(r.value)}` : `Added ${fullName(r.value)}`);
    closeEditor();
    return null;
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const r = await staff.deleteEmployee(toDelete.databaseId);
    setDeleting(false);
    if (!r.ok) return addToast(r.error, "danger");
    addToast(`Deleted ${fullName(toDelete)}`);
    setToDelete(null);
    closeEditor();
  };

  const exportCSV = () => {
    const rows = filtered.map((e) => {
      const rank = index.ranks.get(e.rankId ?? "");
      return [
        e.staffNumber, e.title, e.firstName, e.otherNames, e.lastName, e.gender,
        employmentLabel(e.employmentType), statusLabel(e.status),
        index.departments.get(e.departmentId ?? "")?.name, index.units.get(e.unitId ?? "")?.name,
        index.cadres.get(e.cadreId ?? "")?.name, rank?.name, rank?.level,
        index.positions.get(e.positionId ?? "")?.name, (roles.get(e.databaseId) ?? []).join("; "),
        e.phone, e.email, e.dateFirstAppointment, e.dateCurrentRank,
        e.licenceBody, e.licencePin, e.licenceExpiry, e.cagdStaffId, e.ssnit,
      ];
    });
    downloadCsv(`sech-staff-${todayKey()}.csv`, [
      "Staff number", "Title", "First name", "Other names", "Surname", "Gender", "Employment type", "Status",
      "Department", "Unit", "Cadre", "Rank", "Pay level", "Management position", "Unit roles",
      "Phone", "Email", "First appointment", "Current rank since",
      "Licence council", "Licence PIN", "Licence expiry", "CAGD staff ID", "SSNIT",
    ], rows);
    addToast(`Exported ${rows.length} staff record${rows.length === 1 ? "" : "s"}. The file contains payroll IDs, so store it securely.`);
  };

  const refresh = async () => { setRefreshing(true); await staff.reload(); setRefreshing(false); };
  const closeDelete = useCallback(() => setToDelete(null), []);

  const TILES: { key: Focus; label: string; icon: typeof Users; tone: Tone }[] = [
    { key: "all", label: "Current staff", icon: Users, tone: "brand" },
    { key: "temporary", label: "Temporary postings", icon: IdCard, tone: "info" },
    { key: "licence", label: "Licences to renew", icon: BadgeCheck, tone: "warn" },
    { key: "payroll", label: "No payroll ID yet", icon: AlertTriangle, tone: "danger" },
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Staff records, postings and ranks"
        actions={
          <>
            <button type="button" className="ad-btn" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "ad-spin" : ""} />Refresh
            </button>
            <button type="button" className="ad-btn" onClick={exportCSV} disabled={!filtered.length}>
              <Download size={15} />Export
            </button>
            <button type="button" className="ad-btn ad-btn--primary" onClick={() => setCreating(true)} disabled={!setup}>
              <UserPlus size={15} />Add staff member
            </button>
          </>
        }
      />

      {staff.needsPlugin && (
        <div className="ad-alert ad-tone-warn" role="status" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>WordPress needs the SECH Portal plugin version 1.7.0 before staff records can be kept.</span>
        </div>
      )}
      {staff.error && (
        <div className="ad-alert ad-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{staff.error}</span>
        </div>
      )}

      <div className="ad-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", marginBottom: 16 }}>
        {TILES.map((t) => {
          const Icon = t.icon;
          const active = focus === t.key;
          return (
            <button key={t.key} type="button" className={`ad-card ad-card--hover ad-kpi ad-tone-${t.tone} ad-bk-tile`}
              data-active={active} aria-pressed={active} onClick={() => setFocus(active && t.key !== "all" ? "all" : t.key)}>
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
            <input className="ad-input" placeholder="Name, staff no., phone, PIN" value={query}
              onChange={(e) => setQuery(e.target.value)} aria-label="Search staff" />
          </div>
          <select className="ad-select" style={{ width: 200 }} value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Department">
            <option value="all">All departments</option>
            {setup?.structure.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="ad-select" style={{ width: 200 }} value={cadre} onChange={(e) => setCadre(e.target.value)} aria-label="Cadre">
            <option value="all">All cadres</option>
            {setup?.ranks.cadres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="ad-select" style={{ width: 170 }} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="current">Current staff</option>
            <option value="all">Everyone, incl. left</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {filtersOn && <button type="button" className="ad-btn ad-btn--ghost" onClick={clearFilters}><X size={15} />Clear</button>}
        </div>

        {!staff.loaded ? (
          <SkeletonRows rows={6} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={employees.length ? "No staff match" : "No staff records yet"}
            text={employees.length ? "Try widening the filters." : "Add your first staff member, or set up departments and ranks first."}
            action={
              employees.length ? (
                <button type="button" className="ad-btn" onClick={clearFilters}><X size={15} />Clear filters</button>
              ) : setup ? (
                <button type="button" className="ad-btn ad-btn--primary" onClick={() => setCreating(true)}><UserPlus size={15} />Add staff member</button>
              ) : undefined
            }
          />
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Staff member</th>
                  <th>Rank</th>
                  <th>Posting</th>
                  <th>Roles</th>
                  <th>Licence</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const rank = index.ranks.get(e.rankId ?? "");
                  const unit = index.units.get(e.unitId ?? "");
                  const deptName = index.departments.get(e.departmentId ?? "")?.name;
                  const position = index.positions.get(e.positionId ?? "")?.name;
                  const lic = licenceState(e.licenceExpiry);
                  return (
                    <tr key={e.databaseId} data-clickable="true" onClick={() => setEditing(e)}>
                      <td>
                        <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
                          <Avatar name={fullName(e)} />
                          <div style={{ minWidth: 0 }}>
                            <div className="ad-cell-main">{fullName(e, true)}</div>
                            <div className="ad-cell-sub">
                              {[e.staffNumber, employmentLabel(e.employmentType)].filter(Boolean).join(" · ")}
                              {e.status !== "active" && <> · <Chip tone={STATUS_TONE[e.status] ?? "muted"}>{statusLabel(e.status)}</Chip></>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="ad-cell-main" style={{ fontWeight: 600 }}>{rank?.name ?? "No rank"}</div>
                        <div className="ad-cell-sub">{index.cadres.get(e.cadreId ?? "")?.name ?? ""}</div>
                      </td>
                      <td>
                        <div className="ad-cell-main" style={{ fontWeight: 600 }}>{unit?.name ?? deptName ?? "Not assigned"}</div>
                        <div className="ad-cell-sub">{unit ? deptName : ""}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {position && <Chip tone="gold">{position}</Chip>}
                          {(roles.get(e.databaseId) ?? []).map((r) => <Chip key={r} tone="brand">{r}</Chip>)}
                        </div>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {lic === "expired" ? <Chip tone="danger">Expired</Chip>
                          : lic === "soon" ? <Chip tone="warn">Renew by {formatDate(e.licenceExpiry)}</Chip>
                          : lic === "ok" ? <span className="ad-cell-sub">Until {formatDate(e.licenceExpiry)}</span>
                          : <span className="ad-cell-sub">None</span>}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--ad-text-3)" }}><ChevronRight size={16} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {setup && (
        <EmployeeEditor
          open={creating || !!editing}
          employee={editing}
          setup={setup}
          employees={employees}
          portalUsers={staff.portalUsers}
          onClose={closeEditor}
          onSave={onSave}
          onDelete={(e) => setToDelete(e)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this staff record?"
        text={<>
          <strong>{toDelete ? fullName(toDelete) : ""}</strong> will be removed for good, including from any in-charge post.
          If they have left the hospital, set their status to <strong>Left the hospital</strong> instead, to keep the history.
        </>}
        confirmLabel="Delete"
        icon={Trash2}
        busy={deleting}
        onConfirm={doDelete}
        onCancel={closeDelete}
      />
    </>
  );
}
