"use client";

import { useMemo, useState } from "react";
import { IdCard, Users } from "lucide-react";
import {
  maskGhanaCard,
  matchStaff,
  normalizeGhanaCard,
  type AccDepartment,
  type StaffPerson,
} from "@/lib/accounts";

export interface StaffIdentity {
  name: string;
  ghanaCard: string;
  department: string;
}

const OTHER = "__other";

/** "Nursing and Midwifery, Maternity" for each unit, and the department on its own */
function departmentChoices(departments: AccDepartment[]) {
  return departments.map((d) => ({
    group: d.name,
    options: [d.name, ...d.units.map((u) => `${d.name}, ${u}`)],
  }));
}

/**
 * Staff aren't enrolled yet, so the accounts office types them in. The Ghana Card
 * number is what tells two people with the same name apart; the department or unit
 * is there so a person can be recognised at a glance.
 */
export function StaffIdentityFields({
  value,
  onChange,
  people,
  departments,
  nameLabel = "Staff member",
  nameReadOnly = false,
}: {
  value: StaffIdentity;
  onChange: (patch: Partial<StaffIdentity>) => void;
  /** staff already on record, to spot repeated names and reuse details */
  people: StaffPerson[];
  departments: AccDepartment[];
  nameLabel?: string;
  nameReadOnly?: boolean;
}) {
  const [cardTouched, setCardTouched] = useState(false);
  const [typingDept, setTypingDept] = useState(false);
  const choices = useMemo(() => departmentChoices(departments), [departments]);
  const listed = useMemo(() => new Set(choices.flatMap((c) => c.options)), [choices]);

  const card = normalizeGhanaCard(value.ghanaCard);
  const cardBad = cardTouched && value.ghanaCard.trim() !== "" && !card;
  const match = matchStaff(people, value.name, card);
  const onRecord = match.byCard;
  const differs = !!onRecord && (onRecord.name.trim().toLowerCase() !== value.name.trim().toLowerCase() || onRecord.department !== value.department);

  // free text when nothing is listed, when asked for, or for a department that has since been renamed
  const freeText = !choices.length || typingDept || (value.department !== "" && !listed.has(value.department));

  const finishCard = () => {
    setCardTouched(true);
    if (!card) return;
    const known = people.find((p) => p.ghanaCard === card);
    // a card seen before fills in whatever is still blank
    onChange({
      ghanaCard: card,
      ...(known && !value.name.trim() && !nameReadOnly ? { name: known.name } : {}),
      ...(known && !value.department ? { department: known.department } : {}),
    });
  };

  return (
    <>
      <div className="st-grid">
        <label className="po-field">
          <span className="po-label">{nameLabel} *</span>
          <input className="po-input" value={value.name} onChange={(e) => onChange({ name: e.target.value })} maxLength={120}
            readOnly={nameReadOnly} autoComplete="off" placeholder="Full name as on the Ghana Card" />
        </label>
        <label className="po-field">
          <span className="po-label">Ghana Card number *</span>
          <input
            className="po-input"
            value={value.ghanaCard}
            onChange={(e) => onChange({ ghanaCard: e.target.value.toUpperCase() })}
            onBlur={finishCard}
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            placeholder="GHA-123456789-0"
            aria-invalid={cardBad || undefined}
            style={{ fontFamily: "ui-monospace, monospace", letterSpacing: ".02em" }}
          />
          {cardBad
            ? <span className="po-hint" style={{ color: "var(--po-danger)" }}>Three letters, nine digits and one more digit, as on the card.</span>
            : <span className="po-hint">Tells apart staff who share a name.</span>}
        </label>
      </div>

      <label className="po-field" style={{ marginTop: 12 }}>
        <span className="po-label">Department or unit *</span>
        {freeText ? (
          <input className="po-input" value={value.department} onChange={(e) => onChange({ department: e.target.value })} maxLength={120}
            placeholder="e.g. Nursing and Midwifery, Maternity" />
        ) : (
          <select className="po-select" value={value.department} onChange={(e) => {
            if (e.target.value === OTHER) { setTypingDept(true); onChange({ department: "" }); return; }
            onChange({ department: e.target.value });
          }}>
            <option value="">Choose…</option>
            {choices.map((c) => (
              <optgroup key={c.group} label={c.group}>
                {c.options.map((o, i) => <option key={o} value={o}>{i === 0 ? `${c.group} (no particular unit)` : o}</option>)}
              </optgroup>
            ))}
            <option value={OTHER}>Not listed, type it</option>
          </select>
        )}
        {freeText && choices.length > 0 && (
          <button type="button" className="po-hint" style={{ justifySelf: "start", background: "none", border: 0, padding: 0, cursor: "pointer", textDecoration: "underline" }}
            onClick={() => { setTypingDept(false); onChange({ department: "" }); }}>
            Choose from the list instead
          </button>
        )}
      </label>

      {onRecord && differs && (
        <div className="po-alert po-tone-info" role="status" style={{ marginTop: 12, alignItems: "center" }}>
          <IdCard size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>This card is on record for <strong>{onRecord.name}</strong>, {onRecord.department}.</span>
          {!nameReadOnly && (
            <button type="button" className="po-btn po-btn--sm" onClick={() => onChange({ name: onRecord.name, department: onRecord.department })}>
              Use these
            </button>
          )}
        </div>
      )}
      {match.sameName.length > 0 && (
        <div className="po-alert po-tone-warn" role="status" style={{ marginTop: 12 }}>
          <Users size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            {match.sameName.length === 1 ? "Another staff member has" : `${match.sameName.length} other staff members have`} this name:{" "}
            {match.sameName.slice(0, 3).map((p) => `${p.department}, card ${maskGhanaCard(p.ghanaCard)}`).join("; ")}.
            {" "}Check the card number so the record goes to the right person.
          </span>
        </div>
      )}
    </>
  );
}

/** the card number and department are both filled in properly */
export function staffIdentityProblem(v: StaffIdentity, nameLabel = "staff member"): string | null {
  if (!v.name.trim()) return `Enter the ${nameLabel.toLowerCase()}’s name.`;
  if (!normalizeGhanaCard(v.ghanaCard)) return "Enter the Ghana Card number as it is on the card, e.g. GHA-123456789-0.";
  if (!v.department.trim()) return "Choose the department or unit.";
  return null;
}
