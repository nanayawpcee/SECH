"use client";

import { TITLES } from "@/lib/staff";

/**
 * The name block, shown on both the Work record and Biodata tabs of the staff
 * editor. Both tabs read and write the same record, so a name typed on one is
 * already there on the other.
 */
export function NameFields({ get, set, autoFocus = false }: {
  get: (key: string) => string;
  set: (key: string, value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <div className="st-grid st-grid--name">
        <label className="po-field">
          <span className="po-label">Title</span>
          <select className="po-select" value={get("title")} onChange={(e) => set("title", e.target.value)}>
            <option value="">None</option>
            {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="po-field">
          <span className="po-label">First name *</span>
          <input className="po-input" value={get("firstName")} onChange={(e) => set("firstName", e.target.value)} autoFocus={autoFocus} />
        </label>
        <label className="po-field">
          <span className="po-label">Surname *</span>
          <input className="po-input" value={get("lastName")} onChange={(e) => set("lastName", e.target.value)} />
        </label>
      </div>
      <div className="st-grid">
        <label className="po-field">
          <span className="po-label">Other names</span>
          <input className="po-input" value={get("otherNames")} onChange={(e) => set("otherNames", e.target.value)} />
        </label>
        <label className="po-field">
          <span className="po-label">Gender</span>
          <select className="po-select" value={get("gender")} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Not recorded</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
      </div>
    </>
  );
}
