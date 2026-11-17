"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BriefcaseBusiness,
  IdCard,
  Info,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { Avatar } from "@/components/admin/ui";
import { DatePicker } from "@/components/ui/DatePicker";
import { useAuth } from "@/context/AuthContext";
import { EmployeeBiodata, biodataProblem } from "./EmployeeBiodata";
import { SecretField } from "@/components/admin/RevealPin";
import { NameFields } from "./NameFields";
import { SECRET_FIELDS, isSecretField } from "@/lib/reveal";
import {
  BIODATA_FIELDS,
  EMPLOYEE_INPUT_FIELDS,
  EMPLOYMENT_TYPES,
  LICENCE_BODIES,
  STATUSES,
  formatDate,
  fullName,
  isTemporary,
  licenceState,
  yearsSince,
  type Employee,
  type PortalUserOption,
  type StaffSetup,
} from "@/lib/staff";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { phoneProblem } from "@/lib/phone";

type Form = Record<(typeof EMPLOYEE_INPUT_FIELDS)[number], string> & {
  userId: string;
};

const EMPTY: Form = {
  title: "",
  firstName: "",
  lastName: "",
  otherNames: "",
  gender: "",
  staffNumber: "",
  cadreId: "",
  rankId: "",
  positionId: "",
  departmentId: "",
  unitId: "",
  employmentType: "permanent",
  status: "active",
  phone: "",
  email: "",
  dateFirstAppointment: "",
  dateCurrentRank: "",
  licenceBody: "",
  licencePin: "",
  licenceExpiry: "",
  cagdStaffId: "",
  ssnit: "",
  notes: "",
  dateExited: "",
  userId: "",
  ...(Object.fromEntries(BIODATA_FIELDS.map((k) => [k, ""])) as Record<
    (typeof BIODATA_FIELDS)[number],
    string
  >),
};

function toForm(e: Employee | null): Form {
  if (!e) return EMPTY;
  const f = { ...EMPTY };
  for (const k of EMPLOYEE_INPUT_FIELDS) f[k] = (e[k] as string | null) ?? "";
  // identifiers arrive masked; their boxes start empty and stay out of the save unless changed
  for (const k of SECRET_FIELDS) f[k] = "";
  f.userId = e.userId ? String(e.userId) : "";
  return f;
}

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
  const [tab, setTab] = useState<"work" | "biodata">("work");
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const { admin } = useAuth();

  useEffect(() => {
    if (open) {
      setForm(toForm(employee));
      setError("");
      setTab("work");
      setEditingIds(new Set());
    }
  }, [open, employee]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = (key: keyof Form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const getField = (key: string) => (form as Record<string, string>)[key] ?? "";
  /** the masked number on file, e.g. "••••6789", or null */
  const storedId = (key: string) =>
    employee && isSecretField(key) ? (employee[key] ?? null) : null;
  const isEditingId = (key: string) => !storedId(key) || editingIds.has(key);
  const setEditingId = (key: string, on: boolean) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
    set(key as keyof Form, "");
  };
  const idField = (
    key: "licencePin" | "cagdStaffId" | "ssnit",
    label: string,
  ) => (
    <SecretField
      label={label}
      field={key}
      stored={storedId(key)}
      editing={isEditingId(key)}
      onEditing={(on) => setEditingId(key, on)}
      employeeId={employee?.databaseId}
    >
      <input
        className="po-input"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        autoComplete="off"
        autoFocus={!!storedId(key)}
        aria-label={label}
        spellCheck={false}
      />
    </SecretField>
  );
  const setField = (key: string, value: string) =>
    set(key as keyof Form, value);

  const dept = setup.structure.departments.find(
    (d) => d.id === form.departmentId,
  );
  const cadre = setup.ranks.cadres.find((c) => c.id === form.cadreId);
  const temporary = isTemporary(form.employmentType);
  const inRank = yearsSince(form.dateCurrentRank);
  const inService = yearsSince(form.dateFirstAppointment);
  const licence = licenceState(form.licenceExpiry);

  const takenUserIds = useMemo(
    () =>
      new Set(
        employees
          .filter((e) => e.userId && e.databaseId !== employee?.databaseId)
          .map((e) => e.userId),
      ),
    [employees, employee],
  );

  const save = async () => {
    {
      const p = phoneProblem(form.phone);
      if (p) {
        setTab("work");
        setError(`Phone: ${p}`);
        return;
      }
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First name and surname are required.");
      return;
    }
    {
      const p = biodataProblem(getField);
      if (p) {
        setTab("biodata");
        setError(p);
        return;
      }
    }
    setSaving(true);
    setError("");
    const input: Record<string, unknown> = {
      ...form,
      userId: form.userId ? Number(form.userId) : 0,
    };
    for (const k of SECRET_FIELDS) if (!isEditingId(k)) delete input[k];
    const problem = await onSave(
      input as Partial<Employee>,
      employee?.databaseId,
    );
    setSaving(false);
    if (problem) setError(problem);
  };

  const name =
    form.firstName || form.lastName
      ? fullName({
          title: null,
          firstName: form.firstName,
          lastName: form.lastName,
          otherNames: form.otherNames,
        })
      : "New staff member";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="po-overlay po-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.aside
            className="po-drawer st-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={employee ? `Edit ${name}` : "Add a staff member"}
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="po-drawer-head">
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                <Avatar name={name} size="lg" />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 750,
                      color: "var(--po-text)",
                    }}
                  >
                    {name}
                  </div>
                  <div className="po-cell-sub">
                    {employee ? "Edit staff record" : "Add a staff member"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="po-btn po-btn--ghost po-btn--icon"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="st-tabs">
              <div
                className="po-seg"
                role="tablist"
                aria-label="Part of the record"
              >
                {(
                  [
                    ["biodata", "Biodata", IdCard],
                    ["work", "Employee record", BriefcaseBusiness],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    className="po-seg-btn"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                  >
                    {tab === key && <span className="po-seg-pill" />}
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="po-drawer-body st-form"
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              noValidate
            >
              {employee?.anonymisedAt && (
                <div
                  className="po-alert po-tone-info"
                  role="note"
                  style={{ marginBottom: 16 }}
                >
                  <Info size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    Personal details were removed on{" "}
                    {formatDate(employee.anonymisedAt)} under the retention
                    period. Only the name, staff number, posting and dates of
                    service are kept.
                  </span>
                </div>
              )}
              {tab === "biodata" ? (
                <EmployeeBiodata
                  get={getField}
                  set={setField}
                  showErrors={!!error}
                  myName={admin?.name ?? ""}
                  ids={{
                    stored: storedId,
                    editing: isEditingId,
                    setEditing: setEditingId,
                    employeeId: employee?.databaseId,
                  }}
                />
              ) : (
                <>
                  <h3 className="st-h">Name</h3>
              <NameFields get={getField} set={setField} autoFocus={!employee && !form.firstName} />

              <h3 className="st-h">Employment</h3>
                  <div className="st-grid">
                    <label className="po-field">
                      <span className="po-label">Employment type</span>
                      <select
                        className="po-select"
                        value={form.employmentType}
                        onChange={(e) => set("employmentType", e.target.value)}
                      >
                        {EMPLOYMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="po-field">
                      <span className="po-label">Status</span>
                      <select
                        className="po-select"
                        value={form.status}
                        onChange={(e) => set("status", e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {form.status === "exited" && (
                      <label className="po-field">
                        <span className="po-label">Date left</span>
                        <DatePicker
                          value={form.dateExited}
                          onChange={(v) => set("dateExited", v)}
                          ariaLabel="Date left"
                        />
                        <span className="po-hint">
                          Starts the retention period. Left blank, it is set to
                          the day you save.
                        </span>
                      </label>
                    )}
                    <label className="po-field">
                      <span className="po-label">Hospital staff number</span>
                      <input
                        className="po-input"
                        value={form.staffNumber}
                        onChange={(e) => set("staffNumber", e.target.value)}
                      />
                    </label>
                    <label className="po-field">
                      <span className="po-label">Management position</span>
                      <select
                        className="po-select"
                        value={form.positionId}
                        onChange={(e) => set("positionId", e.target.value)}
                      >
                        <option value="">None</option>
                        {setup.ranks.positions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  {temporary && (
                    <p className="st-note">
                      <Info size={14} />
                      Payroll IDs and a licence are often not issued yet for
                      this kind of posting. Leave them blank until they are.
                    </p>
                  )}

                  <h3 className="st-h">Posting and rank</h3>
                  <div className="st-grid">
                    <label className="po-field">
                      <span className="po-label">Department</span>
                      <select
                        className="po-select"
                        value={form.departmentId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            departmentId: e.target.value,
                            unitId: "",
                          }))
                        }
                      >
                        <option value="">Not assigned</option>
                        {setup.structure.departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="po-field">
                      <span className="po-label">Unit / ward</span>
                      <select
                        className="po-select"
                        value={form.unitId}
                        onChange={(e) => set("unitId", e.target.value)}
                        disabled={!dept}
                      >
                        <option value="">
                          {dept
                            ? "Whole department"
                            : "Choose a department first"}
                        </option>
                        {dept?.units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="po-field">
                      <span className="po-label">Cadre</span>
                      <select
                        className="po-select"
                        value={form.cadreId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            cadreId: e.target.value,
                            rankId: "",
                          }))
                        }
                      >
                        <option value="">Not assigned</option>
                        {setup.ranks.cadres.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="po-field">
                      <span className="po-label">Rank</span>
                      <select
                        className="po-select"
                        value={form.rankId}
                        onChange={(e) => set("rankId", e.target.value)}
                        disabled={!cadre}
                      >
                        <option value="">
                          {cadre ? "No rank yet" : "Choose a cadre first"}
                        </option>
                        {cadre?.ranks.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                            {r.level ? ` (${r.level})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="po-field">
                      <span className="po-label">
                        Date of first appointment
                      </span>
                      <DatePicker
                        value={form.dateFirstAppointment}
                        onChange={(v) => set("dateFirstAppointment", v)}
                        ariaLabel="Date of first appointment"
                      />
                      {inService !== null && (
                        <span className="po-hint">
                          {inService} year{inService === 1 ? "" : "s"} in
                          service
                        </span>
                      )}
                    </label>
                    <label className="po-field">
                      <span className="po-label">Date of current rank</span>
                      <DatePicker
                        value={form.dateCurrentRank}
                        onChange={(v) => set("dateCurrentRank", v)}
                        ariaLabel="Date of current rank"
                      />
                      {inRank !== null && (
                        <span className="po-hint">
                          {inRank} year{inRank === 1 ? "" : "s"} on this rank
                        </span>
                      )}
                    </label>
                  </div>

                  <h3 className="st-h">Contact</h3>
                  <div className="st-grid">
                    <label className="po-field">
                      <span className="po-label">Phone</span>
                      <PhoneInput
                        className="po-input"
                        value={form.phone}
                        onChange={(v) => set("phone", v)}
                        forceShowError={!!error && !!phoneProblem(form.phone)}
                      />
                    </label>
                    <label className="po-field">
                      <span className="po-label">Email</span>
                      <input
                        className="po-input"
                        type="email"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                      />
                    </label>
                  </div>

                  <h3 className="st-h">Professional licence</h3>
                  <div className="st-grid">
                    <label className="po-field">
                      <span className="po-label">Council</span>
                      <select
                        className="po-select"
                        value={form.licenceBody}
                        onChange={(e) => set("licenceBody", e.target.value)}
                      >
                        <option value="">None / not yet</option>
                        {LICENCE_BODIES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </label>
                    {idField("licencePin", "PIN / licence number")}
                    <label className="po-field">
                      <span className="po-label">Expiry date</span>
                      <DatePicker
                        value={form.licenceExpiry}
                        onChange={(v) => set("licenceExpiry", v)}
                        ariaLabel="Licence expiry date"
                      />
                      {licence === "expired" && (
                        <span className="st-warn">Expired</span>
                      )}
                      {licence === "soon" && (
                        <span className="st-warn">Expires within 60 days</span>
                      )}
                    </label>
                  </div>

                  <h3 className="st-h">Payroll</h3>
                  <div className="st-grid">
                    {idField("cagdStaffId", "Controller (CAGD) staff ID")}
                    {idField("ssnit", "SSNIT number")}
                  </div>

                  <h3 className="st-h">Portal login</h3>
                  <label className="po-field">
                    <span className="po-label">Linked account</span>
                    <select
                      className="po-select"
                      value={form.userId}
                      onChange={(e) => set("userId", e.target.value)}
                    >
                      <option value="">Not linked</option>
                      {portalUsers
                        .filter((u) => !takenUserIds.has(u.databaseId))
                        .map((u) => (
                          <option key={u.databaseId} value={u.databaseId}>
                            {u.name}
                            {u.email ? ` (${u.email})` : ""}
                          </option>
                        ))}
                    </select>
                    <span className="po-hint">
                      Optional. Lets this person see their own roster once
                      rosters are built.
                    </span>
                  </label>

                  <h3 className="st-h">Notes</h3>
                  <textarea
                    className="po-input"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    maxLength={2000}
                    style={{ resize: "vertical", minHeight: 80 }}
                    aria-label="Notes"
                    aria-describedby="emp-notes-hint"
                  />
                  <span id="emp-notes-hint" className="po-hint">
                    Work-related notes only. Family, religion and next of kin go
                    under Biodata. Do not record health or disciplinary details
                    here.
                  </span>
                </>
              )}

              {error && (
                <div
                  className="po-alert po-tone-danger"
                  role="alert"
                  style={{ marginTop: 16 }}
                >
                  <AlertTriangle
                    size={17}
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <span>{error}</span>
                </div>
              )}
              <button type="submit" hidden />
            </form>

            <div className="po-drawer-foot">
              {employee && (
                <button
                  type="button"
                  className="po-btn po-btn--ghost"
                  style={{ marginRight: "auto", color: "var(--po-danger)" }}
                  onClick={() => onDelete(employee)}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              )}
              <button
                type="button"
                className="po-btn"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="po-btn po-btn--primary"
                onClick={save}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={15} className="po-spin" />
                    Saving…
                  </>
                ) : employee ? (
                  "Save changes"
                ) : (
                  "Add staff member"
                )}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
