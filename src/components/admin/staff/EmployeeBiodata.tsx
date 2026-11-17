"use client";

import { useState } from "react";
import { Info, Lock, Plus, Trash2, UserRoundCheck } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { phoneProblem } from "@/lib/phone";
import { normalizeGhanaCard } from "@/lib/accounts";
import { SecretField } from "@/components/admin/RevealPin";
import { NameFields } from "./NameFields";
import {
  GHANA_REGIONS,
  MARITAL_STATUSES,
  WORK_PATTERNS,
  parseList,
  type ChildRow,
  type EducationRow,
  type WorkRow,
} from "@/lib/staff";

/**
 * The biodata half of a staff record, following HR's two paper forms: the Catholic
 * Health Service Trust family/personal records form and the SECH new employee form.
 * HR types it in from the forms; the staff member can read it (but not the bank
 * details) under My record.
 */

type Get = (key: string) => string;
type Set = (key: string, value: string) => void;
/** how the editor handles the hidden numbers (Ghana Card, bank accounts) */
export interface IdFields {
  stored: (key: string) => string | null;
  editing: (key: string) => boolean;
  setEditing: (key: string, on: boolean) => void;
  employeeId?: number;
}

const DENOMINATIONS = [
  "Catholic", "Methodist", "Presbyterian", "Anglican", "Evangelical Lutheran", "Baptist",
  "Seventh-day Adventist", "Pentecostal / Charismatic", "Islam", "Traditional", "None", "Other",
];

const today = () => new Date().toISOString().slice(0, 10);

/** Problems to fix before saving; empty when everything is fine */
export function biodataProblem(get: Get): string | null {
  for (const [key, label] of [["nextOfKinPhone", "Next of kin phone"], ["nextOfKinAltPhone", "Next of kin other phone"], ["emergencyPhone", "Emergency contact phone"]] as const) {
    const p = phoneProblem(get(key));
    if (p) return `${label}: ${p}`;
  }
  if (get("ghanaCard").trim() && !normalizeGhanaCard(get("ghanaCard"))) {
    return "Enter the Ghana Card number as it is on the card, e.g. GHA-123456789-0.";
  }
  const email = get("nextOfKinEmail").trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "The next of kin’s email address doesn’t look right.";
  return null;
}

function Text({ label, k, get, set, placeholder, wide = false, max = 120 }: {
  label: string; k: string; get: Get; set: Set; placeholder?: string; wide?: boolean; max?: number;
}) {
  return (
    <label className="po-field" style={wide ? { gridColumn: "1 / -1" } : undefined}>
      <span className="po-label">{label}</span>
      <input className="po-input" value={get(k)} onChange={(e) => set(k, e.target.value)} maxLength={max} placeholder={placeholder} />
    </label>
  );
}

/** One repeating list (children, schools, past jobs) edited as rows */
function ListEditor<T extends { [K in keyof T]: string }>({ k, get, set, blank, columns, addLabel, empty }: {
  k: string; get: Get; set: Set; blank: T; addLabel: string; empty: string;
  columns: { key: keyof T & string; label: string; render?: (value: string, change: (v: string) => void) => React.ReactNode; width?: string }[];
}) {
  const rows = parseList<T>(get(k));
  /** the row just added, so its first box takes the cursor */
  const [added, setAdded] = useState(-1);
  const save = (next: T[]) => set(k, next.length ? JSON.stringify(next) : "");
  const change = (i: number, key: string, v: string) => save(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
  return (
    <div className="bd-list">
      {rows.length === 0 && <p className="po-hint" style={{ margin: "0 0 8px" }}>{empty}</p>}
      {rows.map((row, i) => (
        <div key={i} className="bd-row" style={{ gridTemplateColumns: `${columns.map((c) => c.width ?? "minmax(0, 1fr)").join(" ")} auto` }}>
          {columns.map((c, ci) => (
            <label key={c.key} className="po-field">
              <span className="po-label">{c.label}</span>
              {c.render
                ? c.render(row[c.key] ?? "", (v) => change(i, c.key, v))
                : <input className="po-input" value={row[c.key] ?? ""} onChange={(e) => change(i, c.key, e.target.value)} maxLength={160}
                    autoFocus={ci === 0 && i === added} />}
            </label>
          ))}
          <button type="button" className="po-btn po-btn--ghost po-btn--icon bd-remove" aria-label="Remove this row"
            onClick={() => { setAdded(-1); save(rows.filter((_, j) => j !== i)); }}><Trash2 size={15} /></button>
        </div>
      ))}
      {rows.length < 20 && (
        <button type="button" className="po-btn po-btn--sm" onClick={() => { setAdded(rows.length); save([...rows, { ...blank }]); }}><Plus size={14} />{addLabel}</button>
      )}
    </div>
  );
}

export function EmployeeBiodata({ get, set, showErrors, myName, ids, isNew = false }: {
  get: Get; set: Set; showErrors: boolean; myName: string; ids: IdFields; isNew?: boolean;
}) {
  const card = get("ghanaCard");
  const cardOk = !card.trim() || !!normalizeGhanaCard(card);
  const married = get("maritalStatus") === "married";

  return (
    <>
      <p className="st-note"><Info size={14} />From HR’s new staff forms: the CHST family and personal records form, and the SECH new employee form. Keep the signed paper forms and certificates on file.</p>

      <h3 className="st-h">Name</h3>
      <NameFields get={get} set={set} autoFocus={isNew && !get("firstName")} />

      <h3 className="st-h">Personal details</h3>
      <div className="st-grid">
        <label className="po-field">
          <span className="po-label">Date of birth</span>
          <DatePicker value={get("dateOfBirth")} onChange={(v) => set("dateOfBirth", v)} max={today()} ariaLabel="Date of birth" />
        </label>
        <Text label="Nationality" k="nationality" get={get} set={set} placeholder="Ghanaian" />
        <SecretField label="Ghana Card number" field="ghanaCard" stored={ids.stored("ghanaCard")} editing={ids.editing("ghanaCard")}
          onEditing={(on) => ids.setEditing("ghanaCard", on)} employeeId={ids.employeeId}>
          <input className="po-input" value={card} onChange={(e) => set("ghanaCard", e.target.value.toUpperCase())} maxLength={20}
            onBlur={() => { const n = normalizeGhanaCard(card); if (n) set("ghanaCard", n); }} aria-label="Ghana Card number"
            placeholder="GHA-123456789-0" autoComplete="off" spellCheck={false} aria-invalid={!cardOk || undefined}
            autoFocus={!!ids.stored("ghanaCard")} style={{ fontFamily: "ui-monospace, monospace" }} />
          {!cardOk && <span className="po-hint" style={{ color: "var(--po-danger)" }}>Three letters, nine digits and one more digit, as on the card.</span>}
        </SecretField>
        <label className="po-field">
          <span className="po-label">Religious denomination</span>
          <input className="po-input" value={get("religion")} onChange={(e) => set("religion", e.target.value)} list="bd-denominations" maxLength={120} />
          <datalist id="bd-denominations">{DENOMINATIONS.map((d) => <option key={d} value={d} />)}</datalist>
        </label>
      </div>

      <h3 className="st-h">Hometown</h3>
      <div className="st-grid">
        <Text label="Hometown" k="hometown" get={get} set={set} />
        <Text label="District of hometown" k="hometownDistrict" get={get} set={set} />
        <label className="po-field">
          <span className="po-label">Region</span>
          <select className="po-select" value={get("hometownRegion")} onChange={(e) => set("hometownRegion", e.target.value)}>
            <option value="">Not recorded</option>
            {GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </div>

      <h3 className="st-h">Addresses</h3>
      <div className="st-grid">
        <Text label="Permanent home address" k="homeAddress" get={get} set={set} wide max={300} />
        <Text label="GPS (digital address)" k="gpsAddress" get={get} set={set} placeholder="e.g. BA-0123-4567" />
        <Text label="Residential address" k="residentialAddress" get={get} set={set} placeholder="House no., street, location" max={300} />
      </div>

      <h3 className="st-h">Family</h3>
      <div className="st-grid">
        <label className="po-field">
          <span className="po-label">Marital status</span>
          <select className="po-select" value={get("maritalStatus")} onChange={(e) => set("maritalStatus", e.target.value)}>
            <option value="">Not recorded</option>
            {MARITAL_STATUSES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
        {(married || get("spouseName")) && <Text label="Name of spouse" k="spouseName" get={get} set={set} />}
      </div>
      <span className="po-label" style={{ display: "block", margin: "12px 0 6px" }}>Children</span>
      <ListEditor<ChildRow>
        k="children" get={get} set={set} blank={{ name: "", sex: "", dob: "" }} addLabel="Add a child" empty="No children recorded."
        columns={[
          { key: "name", label: "Name", width: "minmax(0, 1.6fr)" },
          { key: "sex", label: "Sex", width: "minmax(0, .8fr)", render: (v, ch) => (
            <select className="po-select" value={v} onChange={(e) => ch(e.target.value)}>
              <option value="">–</option><option value="female">Female</option><option value="male">Male</option>
            </select>
          ) },
          { key: "dob", label: "Date of birth", width: "minmax(0, 1.1fr)", render: (v, ch) => (
            <DatePicker value={v} onChange={ch} max={today()} ariaLabel="Child’s date of birth" />
          ) },
        ]}
      />

      <div className="st-grid" style={{ marginTop: 14 }}>
        <Text label="Father’s name" k="fatherName" get={get} set={set} />
        <label className="po-field">
          <span className="po-label">Father</span>
          <select className="po-select" value={get("fatherAlive")} onChange={(e) => set("fatherAlive", e.target.value)}>
            <option value="">Not recorded</option><option value="alive">Alive</option><option value="deceased">Deceased</option>
          </select>
        </label>
        <Text label="Father’s residential address" k="fatherAddress" get={get} set={set} wide max={300} />
        <Text label="Mother’s name" k="motherName" get={get} set={set} />
        <label className="po-field">
          <span className="po-label">Mother</span>
          <select className="po-select" value={get("motherAlive")} onChange={(e) => set("motherAlive", e.target.value)}>
            <option value="">Not recorded</option><option value="alive">Alive</option><option value="deceased">Deceased</option>
          </select>
        </label>
        <Text label="Mother’s residential address" k="motherAddress" get={get} set={set} wide max={300} />
      </div>

      <h3 className="st-h">Next of kin</h3>
      <div className="st-grid">
        <Text label="Name" k="nextOfKinName" get={get} set={set} />
        <Text label="Relationship" k="nextOfKinRelationship" get={get} set={set} placeholder="e.g. Sister" />
        <Text label="Address" k="nextOfKinAddress" get={get} set={set} wide max={300} />
        <label className="po-field">
          <span className="po-label">Contact number</span>
          <PhoneInput className="po-input" value={get("nextOfKinPhone")} onChange={(v) => set("nextOfKinPhone", v)} forceShowError={showErrors && !!phoneProblem(get("nextOfKinPhone"))} />
        </label>
        <label className="po-field">
          <span className="po-label">Alternative number</span>
          <PhoneInput className="po-input" value={get("nextOfKinAltPhone")} onChange={(v) => set("nextOfKinAltPhone", v)} forceShowError={showErrors && !!phoneProblem(get("nextOfKinAltPhone"))} />
        </label>
        <label className="po-field">
          <span className="po-label">Email</span>
          <input className="po-input" type="email" value={get("nextOfKinEmail")} onChange={(e) => set("nextOfKinEmail", e.target.value)} maxLength={120} />
        </label>
      </div>

      <div className="bd-head">
        <h3 className="st-h" style={{ margin: 0 }}>Contact in case of emergency</h3>
        {get("nextOfKinName") && (
          <button type="button" className="po-btn po-btn--sm po-btn--ghost" onClick={() => {
            set("emergencyName", get("nextOfKinName"));
            set("emergencyAddress", get("nextOfKinAddress"));
            set("emergencyPhone", get("nextOfKinPhone"));
          }}>Same as next of kin</button>
        )}
      </div>
      <div className="st-grid">
        <Text label="Name" k="emergencyName" get={get} set={set} />
        <label className="po-field">
          <span className="po-label">Telephone</span>
          <PhoneInput className="po-input" value={get("emergencyPhone")} onChange={(v) => set("emergencyPhone", v)} forceShowError={showErrors && !!phoneProblem(get("emergencyPhone"))} />
        </label>
        <Text label="Address" k="emergencyAddress" get={get} set={set} wide max={300} />
      </div>

      <h3 className="st-h">Educational history</h3>
      <ListEditor<EducationRow>
        k="education" get={get} set={set} blank={{ institution: "", year: "", certificate: "" }} addLabel="Add a school" empty="No schools recorded."
        columns={[
          { key: "institution", label: "Institution / school", width: "minmax(0, 1.6fr)" },
          { key: "year", label: "Year", width: "minmax(0, .7fr)" },
          { key: "certificate", label: "Certificate obtained", width: "minmax(0, 1.3fr)" },
        ]}
      />

      <h3 className="st-h">Work history</h3>
      <ListEditor<WorkRow>
        k="workHistory" get={get} set={set} blank={{ organisation: "", year: "", position: "" }} addLabel="Add a past job" empty="No previous jobs recorded."
        columns={[
          { key: "organisation", label: "Organisation", width: "minmax(0, 1.6fr)" },
          { key: "year", label: "Year", width: "minmax(0, .7fr)" },
          { key: "position", label: "Position", width: "minmax(0, 1.3fr)" },
        ]}
      />

      <h3 className="st-h">Employment terms</h3>
      <div className="st-grid">
        <label className="po-field">
          <span className="po-label">Employment status</span>
          <select className="po-select" value={get("workPattern")} onChange={(e) => set("workPattern", e.target.value)}>
            <option value="">Not recorded</option>
            {WORK_PATTERNS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </label>
        <label className="po-field">
          <span className="po-label">Date ending</span>
          <DatePicker value={get("dateEnding")} onChange={(v) => set("dateEnding", v)} ariaLabel="Date ending" />
          <span className="po-hint">For contracts and postings with an end date.</span>
        </label>
      </div>

      <div className="bd-head">
        <h3 className="st-h" style={{ margin: 0 }}>Bank details</h3>
        <span className="bd-private"><Lock size={12} />HR only</span>
      </div>
      <div className="st-grid">
        {([["gmoneyAccount", "G-Money account number"], ["gcbAccount", "GCB account number"]] as const).map(([k, label]) => (
          <SecretField key={k} label={label} field={k} stored={ids.stored(k)} editing={ids.editing(k)}
            onEditing={(on) => ids.setEditing(k, on)} employeeId={ids.employeeId}>
            <input className="po-input" value={get(k)} onChange={(e) => set(k, e.target.value)} maxLength={120} autoComplete="off"
              aria-label={label} spellCheck={false} autoFocus={!!ids.stored(k)} />
          </SecretField>
        ))}
        <Text label="GCB branch" k="gcbBranch" get={get} set={set} />
      </div>
      <p className="po-hint" style={{ margin: "6px 0 0" }}>Stored encrypted. Showing a saved number asks for your reveal PIN. Not shown on the staff member’s own record.</p>

      <h3 className="st-h">Declaration and certification</h3>
      <div className="st-grid">
        <label className="po-field">
          <span className="po-label">Staff signed the declaration on</span>
          <DatePicker value={get("declarationDate")} onChange={(v) => set("declarationDate", v)} max={today()} ariaLabel="Declaration signed on" />
          <span className="po-hint">“My answers are true and honest to the best of my knowledge.”</span>
        </label>
        <label className="po-field">
          <span className="po-label">Certified by (HR)</span>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="po-input" value={get("hrCertifiedBy")} onChange={(e) => set("hrCertifiedBy", e.target.value)} maxLength={120} style={{ flex: 1 }} />
            {myName && !get("hrCertifiedBy") && (
              <button type="button" className="po-btn po-btn--sm" title="Certify as yourself, today"
                onClick={() => { set("hrCertifiedBy", myName); if (!get("hrCertifiedDate")) set("hrCertifiedDate", today()); }}>
                <UserRoundCheck size={14} />Me
              </button>
            )}
          </div>
        </label>
        <label className="po-field">
          <span className="po-label">Certified on</span>
          <DatePicker value={get("hrCertifiedDate")} onChange={(v) => set("hrCertifiedDate", v)} max={today()} ariaLabel="Certified on" />
        </label>
      </div>

      <style>{`
        .bd-list { display: grid; gap: 8px; }
        .bd-row { display: grid; gap: 8px 10px; align-items: end; padding: 10px; border-radius: 12px; background: var(--po-surface-2); border: 1px solid var(--po-border); }
        .bd-remove { color: var(--po-danger); margin-bottom: 2px; }
        .bd-list > .po-btn { justify-self: start; }
        .bd-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin: 22px 0 10px; }
        .bd-private { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px;
          background: var(--po-surface-3); color: var(--po-text-2); }
        @media (max-width: 560px) { .bd-row { grid-template-columns: minmax(0, 1fr) auto !important; } .bd-row > .po-field:not(:first-child) { grid-column: 1 / 2; } .bd-remove { grid-row: 1; grid-column: 2; } }
      `}</style>
    </>
  );
}
