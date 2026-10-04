"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Loader2, Plus, RotateCcw, Save, Trash2, Users } from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { EmptyState, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { useStaff } from "@/components/admin/staff/useStaff";
import { fullName, type Department, type Employee, type StaffStructure } from "@/lib/staff";

const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/** Pick a person for an in-charge slot. Current staff only, grouped by posting. */
function PersonSelect({
  value, onChange, employees, label, preferDept, exclude = 0,
}: {
  value: number;
  onChange: (id: number) => void;
  employees: Employee[];
  label: string;
  preferDept?: string;
  /** Someone who can't be picked here, e.g. the unit's in-charge in the deputy slot. */
  exclude?: number;
}) {
  if (exclude && exclude !== value) employees = employees.filter((e) => e.databaseId !== exclude);
  const inDept = preferDept ? employees.filter((e) => e.departmentId === preferDept) : [];
  const others = preferDept ? employees.filter((e) => e.departmentId !== preferDept) : employees;
  const option = (e: Employee) => <option key={e.databaseId} value={e.databaseId}>{fullName(e, true)}</option>;
  return (
    <select className="po-select" value={value || ""} onChange={(e) => onChange(Number(e.target.value) || 0)} aria-label={label}>
      <option value="">Not set</option>
      {inDept.length > 0 && <optgroup label="In this department">{inDept.map(option)}</optgroup>}
      {others.length > 0 && (preferDept ? <optgroup label="Everyone else">{others.map(option)}</optgroup> : others.map(option))}
    </select>
  );
}

/** Departments and units, each with an in-charge (and a deputy for units). */
export default function DepartmentsPage() {
  const { addToast } = useAdminData();
  const staff = useStaff();
  const [draft, setDraft] = useState<StaffStructure | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Edit a copy; nothing is written until Save.
  useEffect(() => {
    if (staff.setup) setDraft(structuredClone(staff.setup.structure));
  }, [staff.setup]);

  const dirty = useMemo(
    () => !!draft && !!staff.setup && JSON.stringify(draft) !== JSON.stringify(staff.setup.structure),
    [draft, staff.setup],
  );

  const people = useMemo(
    () => staff.employees.filter((e) => e.status !== "exited"),
    [staff.employees],
  );

  const headcount = useMemo(() => {
    const byDept = new Map<string, number>();
    const byUnit = new Map<string, number>();
    for (const e of staff.employees) {
      if (e.status === "exited") continue;
      if (e.departmentId) byDept.set(e.departmentId, (byDept.get(e.departmentId) ?? 0) + 1);
      if (e.unitId) byUnit.set(e.unitId, (byUnit.get(e.unitId) ?? 0) + 1);
    }
    // Anyone still assigned (even people who left) blocks removal.
    const anyUnit = new Set(staff.employees.map((e) => e.unitId).filter(Boolean));
    const anyDept = new Set(staff.employees.map((e) => e.departmentId).filter(Boolean));
    return { byDept, byUnit, anyUnit, anyDept };
  }, [staff.employees]);

  const updateDept = (id: string, patch: Partial<Department>) =>
    setDraft((d) => d && { departments: d.departments.map((x) => (x.id === id ? { ...x, ...patch } : x)) });

  const updateUnit = (deptId: string, unitId: string, patch: Partial<Department["units"][number]>) =>
    setDraft((d) => d && {
      departments: d.departments.map((x) =>
        x.id === deptId ? { ...x, units: x.units.map((u) => (u.id === unitId ? { ...u, ...patch } : u)) } : x),
    });

  const save = async () => {
    if (!draft) return;
    const blank = draft.departments.some((d) => !d.name.trim() || d.units.some((u) => !u.name.trim()));
    if (blank) return setError("Every department and unit needs a name.");
    const doubled = draft.departments.flatMap((d) => d.units).find((u) => u.inchargeId && u.inchargeId === u.deputyId);
    if (doubled) return setError(`${doubled.name} has the same person as in-charge and deputy. Choose a different deputy.`);
    setSaving(true);
    setError("");
    const r = await staff.saveStructure(draft);
    setSaving(false);
    if (!r.ok) return setError(r.error);
    addToast("Departments and units saved");
  };

  return (
    <>
      <PageHeader
        title="Departments and units"
        subtitle="Where staff are posted, and who is in charge"
        actions={
          <>
            <button type="button" className="po-btn" disabled={!dirty || saving} onClick={() => { setDraft(staff.setup ? structuredClone(staff.setup.structure) : null); setError(""); }}>
              <RotateCcw size={15} />Discard changes
            </button>
            <button type="button" className="po-btn po-btn--primary" disabled={!dirty || saving} onClick={save}>
              {saving ? <><Loader2 size={15} className="po-spin" />Saving…</> : <><Save size={15} />Save changes</>}
            </button>
          </>
        }
      />

      {staff.needsPlugin && (
        <div className="po-alert po-tone-warn" role="status" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>WordPress needs the SECH Portal plugin version 1.7.0 before departments can be managed.</span>
        </div>
      )}
      {(error || staff.error) && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error || staff.error}</span>
        </div>
      )}
      {staff.loaded && !staff.needsPlugin && people.length === 0 && (
        <div className="po-alert po-tone-info" role="note" style={{ marginBottom: 16 }}>
          <Users size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Add staff under <strong>Employees</strong> first; then you can choose in-charges here.</span>
        </div>
      )}

      {!staff.loaded ? (
        <section className="po-card"><SkeletonRows rows={6} cols={3} /></section>
      ) : !draft ? (
        <section className="po-card"><EmptyState icon={Building2} title="Nothing to show yet" /></section>
      ) : (
        <div className="st-stack">
          {draft.departments.map((d) => {
            const count = headcount.byDept.get(d.id) ?? 0;
            const locked = headcount.anyDept.has(d.id);
            return (
              <section key={d.id} className="po-card st-dept">
                <header className="st-dept-head">
                  <span className="st-dept-icon"><Building2 size={18} /></span>
                  <input className="po-input st-name-input" value={d.name} onChange={(e) => updateDept(d.id, { name: e.target.value })}
                    aria-label="Department name" placeholder="Department name" />
                  <span className="st-count"><Users size={13} />{count}</span>
                  <label className="st-incharge">
                    <span>Head / in-charge</span>
                    <PersonSelect value={d.inchargeId} onChange={(id) => updateDept(d.id, { inchargeId: id })} employees={people}
                      label={`In-charge of ${d.name}`} preferDept={d.id} />
                  </label>
                  <button type="button" className="po-btn po-btn--ghost po-btn--icon" disabled={locked}
                    title={locked ? "Staff are still posted here" : "Remove department"} aria-label={`Remove ${d.name}`}
                    onClick={() => setDraft((x) => x && { departments: x.departments.filter((y) => y.id !== d.id) })}>
                    <Trash2 size={15} />
                  </button>
                </header>

                <div className="st-units">
                  <div className="st-units-head" aria-hidden="true">
                    <span>Unit / ward</span><span>In-charge</span><span>Deputy</span><span>Staff</span><span />
                  </div>
                  {d.units.map((u) => {
                    const uLocked = headcount.anyUnit.has(u.id);
                    return (
                      <div key={u.id} className="st-unit">
                        <input className="po-input" value={u.name} onChange={(e) => updateUnit(d.id, u.id, { name: e.target.value })}
                          aria-label="Unit name" placeholder="Unit name" />
                        <PersonSelect value={u.inchargeId} onChange={(id) => updateUnit(d.id, u.id, { inchargeId: id, deputyId: id && id === u.deputyId ? 0 : u.deputyId })}
                          employees={people} label={`In-charge of ${u.name}`} preferDept={d.id} />
                        <PersonSelect value={u.deputyId} onChange={(id) => updateUnit(d.id, u.id, { deputyId: id })}
                          employees={people} label={`Deputy of ${u.name}`} preferDept={d.id} exclude={u.inchargeId} />
                        <span className="st-count"><Users size={13} />{headcount.byUnit.get(u.id) ?? 0}</span>
                        <button type="button" className="po-btn po-btn--ghost po-btn--icon po-btn--sm" disabled={uLocked}
                          title={uLocked ? "Staff are still posted here" : "Remove unit"} aria-label={`Remove ${u.name}`}
                          onClick={() => updateDept(d.id, { units: d.units.filter((x) => x.id !== u.id) })}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                  <button type="button" className="po-btn po-btn--sm po-btn--ghost st-add"
                    onClick={() => updateDept(d.id, { units: [...d.units, { id: newId("unit"), name: "", inchargeId: 0, deputyId: 0 }] })}>
                    <Plus size={14} />Add unit
                  </button>
                </div>
              </section>
            );
          })}
          <button type="button" className="po-btn st-add-dept"
            onClick={() => setDraft((x) => x && { departments: [...x.departments, { id: newId("dept"), name: "", inchargeId: 0, units: [] }] })}>
            <Plus size={15} />Add department
          </button>
        </div>
      )}

      {dirty && (
        <div className="st-savebar" role="status">
          <span>You have unsaved changes.</span>
          <button type="button" className="po-btn po-btn--primary po-btn--sm" onClick={save} disabled={saving}>
            {saving ? <><Loader2 size={14} className="po-spin" />Saving…</> : <><Save size={14} />Save changes</>}
          </button>
        </div>
      )}
    </>
  );
}
