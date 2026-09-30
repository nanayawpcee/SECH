"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, Loader2, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/admin/ui";
import {
  EMPLOYEE_INPUT_FIELDS,
  EMPLOYMENT_TYPES,
  LICENCE_BODIES,
  STATUSES,
  TITLES,
  fullName,
  isTemporary,
  licenceState,
  yearsSince,
  type Employee,
  type PortalUserOption,
  type StaffSetup,
} from "@/lib/staff";

type Form = Record<(typeof EMPLOYEE_INPUT_FIELDS)[number], string> & { userId: string };

const EMPTY: Form = {
  title: "", firstName: "", lastName: "", otherNames: "", gender: "", staffNumber: "",
  cadreId: "", rankId: "", positionId: "", departmentId: "", unitId: "",
  employmentType: "permanent", status: "active", phone: "", email: "",
  dateFirstAppointment: "", dateCurrentRank: "",
  licenceBody: "", licencePin: "", licenceExpiry: "",
  cagdStaffId: "", ssnit: "", notes: "", userId: "",
};

function toForm(e: Employee | null): Form {
  if (!e) return EMPTY;
  const f = { ...EMPTY };
  for (const k of EMPLOYEE_INPUT_FIELDS) f[k] = (e[k] as string | null) ?? "";
  f.userId = e.userId ? String(e.userId) : "";
  return f;
}

/**
 * Add or edit one staff record, in a side drawer. `employee` null + `open`
 * true means a new record. Everything except the names is optional: new
 * nurses and national service persons often have no payroll ID or licence yet.
 */
export function EmployeeEditor({
  open,
  employee,
  setup,
  employees,
  portalUsers,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  employee: Employee | null;
  setup: StaffSetup;
  employees: Employee[];
  portalUsers: PortalUserOption[];
  onClose: () => void;
  onSave: (input: Partial<Employee>, id?: number) => Promise<string | null>;
  onDelete: (e: Employee) => void;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(toForm(employee));
      setError("");
    }
  }, [open, employee]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const dept = setup.structure.departments.find((d) => d.id === form.departmentId);
  const cadre = setup.ranks.cadres.find((c) => c.id === form.cadreId);
  const temporary = isTemporary(form.employmentType);
  const inRank = yearsSince(form.dateCurrentRank);
  const inService = yearsSince(form.dateFirstAppointment);
  const licence = licenceState(form.licenceExpiry);

  // A login can belong to one record only; hide the ones already taken.
  const takenUserIds = useMemo(
    () => new Set(employees.filter((e) => e.userId && e.databaseId !== employee?.databaseId).map((e) => e.userId)),
    [employees, employee],
  );

  const save = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and surname are required.");
      return;
    }
    setSaving(true);
    setError("");
    const input: Record<string, unknown> = { ...form, userId: form.userId ? Number(form.userId) : 0 };
    const problem = await onSave(input as Partial<Employee>, employee?.databaseId);
    setSaving(false);
    if (problem) setError(problem);
  };

  const name = form.firstName || form.lastName ? fullName({ title: null, firstName: form.firstName, lastName: form.lastName, otherNames: form.otherNames }) : "New staff member";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ad-overlay ad-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.aside
            className="ad-drawer st-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={employee ? `Edit ${name}` : "Add a staff member"}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }} /* same unit as initial/exit, or the exit never completes */
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="ad-drawer-head">
              <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                <Avatar name={name} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 750, color: "var(--ad-text)" }}>{name}</div>
                  <div className="ad-cell-sub">{employee ? "Edit staff record" : "Add a staff member"}</div>
                </div>
              </div>
              <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>

            <form className="ad-drawer-body st-form" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
              <h3 className="st-h">Name</h3>
              <div className="st-grid st-grid--name">
                <label className="ad-field">
                  <span className="ad-label">Title</span>
                  <select className="ad-select" value={form.title} onChange={(e) => set("title", e.target.value)}>
                    <option value="">None</option>
                    {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">First name *</span>
                  <input className="ad-input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} autoFocus={!employee} />
                </label>
                <label className="ad-field">
                  <span className="ad-label">Surname *</span>
                  <input className="ad-input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
                </label>
              </div>
              <div className="st-grid">
                <label className="ad-field">
                  <span className="ad-label">Other names</span>
                  <input className="ad-input" value={form.otherNames} onChange={(e) => set("otherNames", e.target.value)} />
                </label>
                <label className="ad-field">
                  <span className="ad-label">Gender</span>
                  <select className="ad-select" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    <option value="">Not recorded</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </label>
              </div>

              <h3 className="st-h">Employment</h3>
              <div className="st-grid">
                <label className="ad-field">
                  <span className="ad-label">Employment type</span>
                  <select className="ad-select" value={form.employmentType} onChange={(e) => set("employmentType", e.target.value)}>
                    {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">Status</span>
                  <select className="ad-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">Hospital staff number</span>
                  <input className="ad-input" value={form.staffNumber} onChange={(e) => set("staffNumber", e.target.value)} />
                </label>
                <label className="ad-field">
                  <span className="ad-label">Management position</span>
                  <select className="ad-select" value={form.positionId} onChange={(e) => set("positionId", e.target.value)}>
                    <option value="">None</option>
                    {setup.ranks.positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              </div>
              {temporary && (
                <p className="st-note"><Info size={14} />Payroll IDs and a licence are often not issued yet for this kind of posting. Leave them blank until they are.</p>
              )}

              <h3 className="st-h">Posting and rank</h3>
              <div className="st-grid">
                <label className="ad-field">
                  <span className="ad-label">Department</span>
                  <select className="ad-select" value={form.departmentId}
                    onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value, unitId: "" }))}>
                    <option value="">Not assigned</option>
                    {setup.structure.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">Unit / ward</span>
                  <select className="ad-select" value={form.unitId} onChange={(e) => set("unitId", e.target.value)} disabled={!dept}>
                    <option value="">{dept ? "Whole department" : "Choose a department first"}</option>
                    {dept?.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">Cadre</span>
                  <select className="ad-select" value={form.cadreId}
                    onChange={(e) => setForm((f) => ({ ...f, cadreId: e.target.value, rankId: "" }))}>
                    <option value="">Not assigned</option>
                    {setup.ranks.cadres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">Rank</span>
                  <select className="ad-select" value={form.rankId} onChange={(e) => set("rankId", e.target.value)} disabled={!cadre}>
                    <option value="">{cadre ? "No rank yet" : "Choose a cadre first"}</option>
                    {cadre?.ranks.map((r) => <option key={r.id} value={r.id}>{r.name}{r.level ? ` (${r.level})` : ""}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">Date of first appointment</span>
                  <input className="ad-input" type="date" value={form.dateFirstAppointment} onChange={(e) => set("dateFirstAppointment", e.target.value)} />
                  {inService !== null && <span className="ad-hint">{inService} year{inService === 1 ? "" : "s"} in service</span>}
                </label>
                <label className="ad-field">
                  <span className="ad-label">Date of current rank</span>
                  <input className="ad-input" type="date" value={form.dateCurrentRank} onChange={(e) => set("dateCurrentRank", e.target.value)} />
                  {inRank !== null && <span className="ad-hint">{inRank} year{inRank === 1 ? "" : "s"} on this rank</span>}
                </label>
              </div>

              <h3 className="st-h">Contact</h3>
              <div className="st-grid">
                <label className="ad-field">
                  <span className="ad-label">Phone</span>
                  <input className="ad-input" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </label>
                <label className="ad-field">
                  <span className="ad-label">Email</span>
                  <input className="ad-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </label>
              </div>

              <h3 className="st-h">Professional licence</h3>
              <div className="st-grid">
                <label className="ad-field">
                  <span className="ad-label">Council</span>
                  <select className="ad-select" value={form.licenceBody} onChange={(e) => set("licenceBody", e.target.value)}>
                    <option value="">None / not yet</option>
                    {LICENCE_BODIES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
                <label className="ad-field">
                  <span className="ad-label">PIN / licence number</span>
                  <input className="ad-input" value={form.licencePin} onChange={(e) => set("licencePin", e.target.value)} />
                </label>
                <label className="ad-field">
                  <span className="ad-label">Expiry date</span>
                  <input className="ad-input" type="date" value={form.licenceExpiry} onChange={(e) => set("licenceExpiry", e.target.value)} />
                  {licence === "expired" && <span className="st-warn">Expired</span>}
                  {licence === "soon" && <span className="st-warn">Expires within 60 days</span>}
                </label>
              </div>

              <h3 className="st-h">Payroll</h3>
              <div className="st-grid">
                <label className="ad-field">
                  <span className="ad-label">Controller (CAGD) staff ID</span>
                  <input className="ad-input" value={form.cagdStaffId} onChange={(e) => set("cagdStaffId", e.target.value)} autoComplete="off" />
                </label>
                <label className="ad-field">
                  <span className="ad-label">SSNIT number</span>
                  <input className="ad-input" value={form.ssnit} onChange={(e) => set("ssnit", e.target.value)} autoComplete="off" />
                </label>
              </div>

              <h3 className="st-h">Portal login</h3>
              <label className="ad-field">
                <span className="ad-label">Linked account</span>
                <select className="ad-select" value={form.userId} onChange={(e) => set("userId", e.target.value)}>
                  <option value="">Not linked</option>
                  {portalUsers.filter((u) => !takenUserIds.has(u.databaseId)).map((u) => (
                    <option key={u.databaseId} value={u.databaseId}>{u.name}{u.email ? ` (${u.email})` : ""}</option>
                  ))}
                </select>
                <span className="ad-hint">Optional. Lets this person see their own roster once rosters are built.</span>
              </label>

              <h3 className="st-h">Notes</h3>
              <textarea className="ad-input" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={2000}
                style={{ resize: "vertical", minHeight: 80 }} aria-label="Notes" />

              {error && (
                <div className="ad-alert ad-tone-danger" role="alert" style={{ marginTop: 16 }}>
                  <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
                </div>
              )}
              <button type="submit" hidden />
            </form>

            <div className="ad-drawer-foot">
              {employee && (
                <button type="button" className="ad-btn ad-btn--ghost" style={{ marginRight: "auto", color: "var(--ad-danger)" }} onClick={() => onDelete(employee)}>
                  <Trash2 size={15} />Delete
                </button>
              )}
              <button type="button" className="ad-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="button" className="ad-btn ad-btn--primary" onClick={save} disabled={saving}>
                {saving ? <><Loader2 size={15} className="ad-spin" />Saving…</> : employee ? "Save changes" : "Add staff member"}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
