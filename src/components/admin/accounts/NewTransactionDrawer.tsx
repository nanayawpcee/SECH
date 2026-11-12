"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, IdCard, Loader2, X } from "lucide-react";
import {
  CATEGORIES,
  categoryOf,
  formatMoney,
  knownStaff,
  normalizeGhanaCard,
  parseMoney,
  periodLabel,
  rentLimits,
  staffSubline,
  type AccAdvance,
  type AccDepartment,
  type AccTenancy,
  type AccTransaction,
} from "@/lib/accounts";
import { StaffIdentityFields, staffIdentityProblem } from "./StaffIdentityFields";
import { DatePicker } from "@/components/ui/DatePicker";

export interface Preset {
  category?: string;
  advanceId?: number;
  tenancyId?: number;
}

const EMPTY = {
  category: "", party: "", phone: "", amount: "", description: "",
  advanceId: "", tenancyId: "", monthly: "", purpose: "", ghanaCard: "", department: "", months: "",
};

export function NewTransactionDrawer({
  open,
  preset,
  advances,
  tenancies,
  transactions,
  departments,
  onClose,
  onRecord,
}: {
  open: boolean;
  preset?: Preset | null;
  advances: AccAdvance[];
  tenancies: AccTenancy[];
  /** recent receipts, so staff seen there are recognised too */
  transactions?: AccTransaction[];
  departments: AccDepartment[];
  onClose: () => void;
  onRecord: (input: Record<string, unknown>) => Promise<{ ok: true; value: AccTransaction } | { ok: false; error: string }>;
}) {
  const [form, setForm] = useState(EMPTY);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const next = { ...EMPTY, category: preset?.category ?? "" };
    if (preset?.advanceId) {
      const a = advances.find((x) => x.databaseId === preset.advanceId);
      next.advanceId = String(preset.advanceId);
      next.party = a?.staffName ?? "";
    }
    if (preset?.tenancyId) {
      const t = tenancies.find((x) => x.databaseId === preset.tenancyId);
      next.tenancyId = String(preset.tenancyId);
      next.party = t?.tenantName ?? "";
      next.amount = t && rentLimits(t).maxMonths > 0 ? (t.monthlyRate / 100).toFixed(2) : "";
    }
    setForm(next);
    const t0 = preset?.tenancyId ? tenancies.find((x) => x.databaseId === preset.tenancyId) : undefined;
    setDetails(t0 && rentLimits(t0).maxMonths > 0 ? { period: periodLabel(rentLimits(t0).firstUnpaid, 1) } : {});
    if (t0 && rentLimits(t0).maxMonths > 0) setForm((f) => ({ ...f, months: "1" }));
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset]);

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const cat = categoryOf(form.category);
  const openAdvances = useMemo(() => advances.filter((a) => a.status === "outstanding"), [advances]);
  const activeTenancies = useMemo(() => tenancies.filter((t) => t.status === "active" || t.balance > 0), [tenancies]);
  const advance = advances.find((a) => String(a.databaseId) === form.advanceId);
  const tenancy = tenancies.find((t) => String(t.databaseId) === form.tenancyId);
  const people = useMemo(() => knownStaff(advances, tenancies, transactions), [advances, tenancies, transactions]);
  // a repayment or rent belongs to whoever the advance or tenancy is for
  const linked = cat?.key === "advance_repayment" ? advance : cat?.key === "rent" ? tenancy : undefined;
  const linkedComplete = !!linked?.ghanaCard && !!linked?.department;
  const askIdentity = !!cat?.staff && (!cat.link || cat.key === "salary_advance" || (!!linked && !linkedComplete));
  const cardNow = normalizeGhanaCard(form.ghanaCard);
  const alreadyOwing = cat?.key === "salary_advance" && cardNow
    ? openAdvances.filter((a) => a.ghanaCard === cardNow)
    : [];

  const pickCategory = (key: string) => {
    setForm((f) => ({ ...EMPTY, category: key, phone: f.phone }));
    setDetails({});
    setError("");
  };

  const pickAdvance = (id: string) => {
    const a = advances.find((x) => String(x.databaseId) === id);
    setForm((f) => ({ ...f, advanceId: id, party: a?.staffName ?? f.party,
      amount: a && a.monthlyDeduction ? (Math.min(a.monthlyDeduction, a.outstanding) / 100).toFixed(2) : f.amount }));
  };
  const pickTenancy = (id: string) => {
    const t = tenancies.find((x) => String(x.databaseId) === id);
    const can = t ? rentLimits(t).maxMonths > 0 : false;
    setForm((f) => ({ ...f, tenancyId: id, party: t?.tenantName ?? f.party, months: can ? "1" : "",
      amount: t && can ? (t.monthlyRate / 100).toFixed(2) : "" }));
    setDetails((d) => ({ ...d, period: t && can ? periodLabel(rentLimits(t).firstUnpaid, 1) : "" }));
  };
  // rent is paid in whole months, a year at most
  const pickMonths = (n: string) => {
    if (!tenancy) return;
    setForm((f) => ({ ...f, months: n, amount: n ? ((Number(n) * tenancy.monthlyRate) / 100).toFixed(2) : f.amount }));
    if (n) setDetails((d) => ({ ...d, period: periodLabel(rentLimits(tenancy).firstUnpaid, Number(n)) }));
  };
  const rent = tenancy ? rentLimits(tenancy) : null;

  const toggleCheck = (key: string, option: string) => {
    const list = (details[key] ?? "").split(", ").filter(Boolean);
    const next = list.includes(option) ? list.filter((o) => o !== option) : [...list, option];
    setDetails((d) => ({ ...d, [key]: next.join(", ") }));
  };

  const submit = async () => {
    setError("");
    if (!cat) return setError("Choose what this payment is for.");
    const amount = parseMoney(form.amount);
    if (!amount) return setError("Enter the amount in cedis, e.g. 150 or 150.50.");
    if (cat.key === "advance_repayment" && !advance) return setError("Choose the salary advance being repaid.");
    if (cat.key === "rent" && !tenancy) return setError("Choose the tenancy this rent is for.");
    if (cat.key === "rent" && rent) {
      if (rent.maxAmount <= 0) return setError("This tenant has already paid 12 months ahead.");
      if (amount > rent.maxAmount) {
        return setError(`Rent is limited to 12 months at a time and 12 months ahead. The most this tenant can pay now is ${formatMoney(rent.maxAmount)}.`);
      }
    }
    if (askIdentity) {
      const problem = staffIdentityProblem({ name: form.party, ghanaCard: form.ghanaCard, department: form.department }, cat.partyLabel);
      if (problem) return setError(problem);
    }
    if (!form.party.trim()) return setError(`Enter the ${(cat.partyLabel ?? (cat.direction === "in" ? "payer" : "person paid")).toLowerCase()}.`);
    for (const f of cat.fields) if (f.required && !details[f.key]?.trim()) return setError(`Fill in “${f.label}”.`);
    if ((cat.key === "other_in" || cat.key === "other_out") && !form.description.trim()) return setError("Describe what this is for.");

    setSaving(true);
    const r = await onRecord({
      category: cat.key,
      party: form.party.trim(),
      amount,
      phone: form.phone.trim() || null,
      description: form.description.trim() || null,
      details,
      advanceId: form.advanceId ? Number(form.advanceId) : null,
      tenancyId: form.tenancyId ? Number(form.tenancyId) : null,
      monthlyDeduction: parseMoney(form.monthly) ?? 0,
      purpose: form.purpose.trim() || null,
      ghanaCard: askIdentity ? cardNow : null,
      department: askIdentity ? form.department.trim() : null,
    });
    setSaving(false);
    if (!r.ok) setError(r.error);
  };

  const partyLabel = cat?.partyLabel ?? (cat?.direction === "out" ? "Paid to" : "Received from");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="po-overlay po-drawer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
        >
          <motion.aside
            className="po-drawer st-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="New receipt"
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div className="po-drawer-head">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 750, color: "var(--po-text)" }}>
                  {cat?.direction === "out" ? "New payment voucher" : "New receipt"}
                </div>
                <div className="po-cell-sub">Cash. Once saved it can only be voided, not edited.</div>
              </div>
              <button type="button" className="po-btn po-btn--ghost po-btn--icon" onClick={onClose} aria-label="Close" disabled={saving}><X size={18} /></button>
            </div>

            <form className="po-drawer-body st-form" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
              <h3 className="st-h">What is it for</h3>
              <label className="po-field" style={{ marginBottom: 12 }}>
                <span className="po-label">Category *</span>
                <select className="po-select" value={form.category} onChange={(e) => pickCategory(e.target.value)}>
                  <option value="">Choose…</option>
                  <optgroup label="Money in (receipt)">
                    {CATEGORIES.filter((c) => c.direction === "in").map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </optgroup>
                  <optgroup label="Money out (payment voucher)">
                    {CATEGORIES.filter((c) => c.direction === "out").map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </optgroup>
                </select>
              </label>

              {cat && (
                <div className={`po-alert po-tone-${cat.direction === "in" ? "success" : "warn"}`} style={{ marginBottom: 14, alignItems: "center" }}>
                  {cat.direction === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  <span>{cat.direction === "in" ? "Cash coming in. A receipt is issued." : "Cash going out. A payment voucher is issued."}</span>
                </div>
              )}

              {cat?.key === "advance_repayment" && (
                <label className="po-field" style={{ marginBottom: 12 }}>
                  <span className="po-label">Salary advance *</span>
                  <select className="po-select" value={form.advanceId} onChange={(e) => pickAdvance(e.target.value)}>
                    <option value="">Choose…</option>
                    {openAdvances.map((a) => (
                      <option key={a.databaseId} value={a.databaseId}>
                        {a.staffName}{staffSubline(a) ? ` (${staffSubline(a)})` : ""}: {formatMoney(a.outstanding)} still owed
                      </option>
                    ))}
                  </select>
                  {!openAdvances.length && <span className="po-hint">No advances are waiting to be repaid.</span>}
                </label>
              )}

              {cat?.key === "rent" && (
                <label className="po-field" style={{ marginBottom: 12 }}>
                  <span className="po-label">Tenancy *</span>
                  <select className="po-select" value={form.tenancyId} onChange={(e) => pickTenancy(e.target.value)}>
                    <option value="">Choose…</option>
                    {activeTenancies.map((t) => (
                      <option key={t.databaseId} value={t.databaseId}>
                        {t.tenantName}{staffSubline(t) ? ` (${staffSubline(t)})` : ""}{t.unit ? `, ${t.unit}` : ""}
                        {t.balance > 0 ? `: ${formatMoney(t.balance)} owed` : ""}
                      </option>
                    ))}
                  </select>
                  {!activeTenancies.length && <span className="po-hint">Add tenancies on the Staff rent page first.</span>}
                </label>
              )}

              {cat && (
                <>
                  {cat.staff && linked && linkedComplete && (
                    <div className="po-alert po-tone-info" style={{ marginBottom: 12, alignItems: "center" }}>
                      <IdCard size={16} style={{ flexShrink: 0 }} />
                      <span><strong>{form.party}</strong>, {staffSubline(linked)}</span>
                    </div>
                  )}
                  {cat.staff && linked && !linkedComplete && (
                    <p className="po-hint" style={{ margin: "0 0 10px" }}>
                      This {cat.key === "rent" ? "tenancy" : "advance"} was recorded before card numbers were kept. Add them once and they are saved on it.
                    </p>
                  )}

                  {askIdentity ? (
                    <>
                      <StaffIdentityFields
                        value={{ name: form.party, ghanaCard: form.ghanaCard, department: form.department }}
                        onChange={(p) => setForm((f) => ({
                          ...f,
                          ...(p.name !== undefined ? { party: p.name } : {}),
                          ...(p.ghanaCard !== undefined ? { ghanaCard: p.ghanaCard } : {}),
                          ...(p.department !== undefined ? { department: p.department } : {}),
                        }))}
                        people={people}
                        departments={departments}
                        nameLabel={partyLabel}
                        nameReadOnly={!!linked}
                      />
                      {alreadyOwing.length > 0 && (
                        <div className="po-alert po-tone-warn" role="status" style={{ marginTop: 12 }}>
                          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>
                            This staff member still owes {formatMoney(alreadyOwing.reduce((s, a) => s + a.outstanding, 0))} on{" "}
                            {alreadyOwing.length === 1 ? "an earlier advance" : `${alreadyOwing.length} earlier advances`}.
                          </span>
                        </div>
                      )}
                      <div className="st-grid" style={{ marginTop: 12 }}>
                        <label className="po-field">
                          <span className="po-label">Phone</span>
                          <input className="po-input" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="st-grid">
                      <label className="po-field">
                        <span className="po-label">{partyLabel} *</span>
                        <input className="po-input" value={form.party} onChange={(e) => set("party", e.target.value)} maxLength={120}
                          readOnly={cat.key === "advance_repayment" || cat.key === "rent"} />
                      </label>
                      <label className="po-field">
                        <span className="po-label">Phone</span>
                        <input className="po-input" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} />
                      </label>
                    </div>
                  )}

                  {cat.key === "rent" && tenancy && rent && (
                    rent.maxMonths > 0 ? (
                      <div className="st-grid">
                        <label className="po-field">
                          <span className="po-label">Months paying for *</span>
                          <select className="po-select" value={form.months} onChange={(e) => pickMonths(e.target.value)}>
                            {Array.from({ length: rent.maxMonths }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n} month{n === 1 ? "" : "s"}, {formatMoney(n * tenancy.monthlyRate)}</option>
                            ))}
                            <option value="">Part of a month (type the amount)</option>
                          </select>
                          <span className="po-hint">At most 12 months at a time, and never more than 12 months ahead.</span>
                        </label>
                      </div>
                    ) : (
                      <div className="po-alert po-tone-warn" role="status" style={{ marginBottom: 12 }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{form.party} has already paid 12 months ahead. No more rent can be taken yet.</span>
                      </div>
                    )
                  )}

                  {cat.fields.length > 0 && (
                    <div className="st-grid">
                      {cat.fields.map((f) =>
                        f.kind === "checks" ? (
                          <fieldset key={f.key} className="po-field" style={{ gridColumn: "1 / -1", border: 0, padding: 0, margin: 0 }}>
                            <span className="po-label">{f.label}{f.required ? " *" : ""}</span>
                            <div className="dr-pills">
                              {f.options.map((o) => {
                                const on = (details[f.key] ?? "").split(", ").includes(o);
                                return (
                                  <button key={o} type="button" className="dr-pill" aria-pressed={on} onClick={() => toggleCheck(f.key, o)}>
                                    {o}
                                  </button>
                                );
                              })}
                            </div>
                          </fieldset>
                        ) : f.kind === "select" ? (
                          <label key={f.key} className="po-field">
                            <span className="po-label">{f.label}{f.required ? " *" : ""}</span>
                            <select className="po-select" value={details[f.key] ?? ""} onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))}>
                              <option value="">Choose…</option>
                              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          </label>
                        ) : f.kind === "date" ? (
                          <label key={f.key} className="po-field">
                            <span className="po-label">{f.label}{f.required ? " *" : ""}</span>
                            <DatePicker value={details[f.key] ?? ""} ariaLabel={f.label}
                              onChange={(v) => setDetails((d) => ({ ...d, [f.key]: v }))} />
                          </label>
                        ) : (
                          <label key={f.key} className="po-field">
                            <span className="po-label">{f.label}{f.required ? " *" : ""}</span>
                            <input
                              className="po-input"
                              type="text"
                              inputMode={f.kind === "number" ? "numeric" : undefined}
                              placeholder={f.placeholder}
                              value={details[f.key] ?? ""}
                              onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))}
                              maxLength={200}
                            />
                          </label>
                        ),
                      )}
                    </div>
                  )}

                  {cat.key === "salary_advance" && (
                    <div className="st-grid">
                      <label className="po-field">
                        <span className="po-label">Monthly repayment (GHS)</span>
                        <input className="po-input" inputMode="decimal" value={form.monthly} onChange={(e) => set("monthly", e.target.value)} placeholder="e.g. 200" />
                      </label>
                      <label className="po-field">
                        <span className="po-label">Purpose</span>
                        <input className="po-input" value={form.purpose} onChange={(e) => set("purpose", e.target.value)} maxLength={200} />
                      </label>
                    </div>
                  )}

                  <h3 className="st-h">Amount</h3>
                  <div className="st-grid">
                    <label className="po-field">
                      <span className="po-label">Amount (GHS) *</span>
                      <input className="po-input" inputMode="decimal" value={form.amount}
                        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value, months: cat.key === "rent" ? "" : f.months }))} placeholder="0.00"
                        style={{ fontSize: 18, fontWeight: 700 }} />
                      {advance && <span className="po-hint">Still owed: {formatMoney(advance.outstanding)}</span>}
                      {tenancy && (
                        <span className="po-hint">
                          {formatMoney(tenancy.monthlyRate)} a month. {tenancy.balance > 0 ? `${formatMoney(tenancy.balance)} owed.` : "Up to date."}
                          {rent && rent.maxAmount > 0 ? ` Up to ${formatMoney(rent.maxAmount)} can be paid now.` : ""}
                        </span>
                      )}
                    </label>
                    <label className="po-field">
                      <span className="po-label">Payment method</span>
                      <input className="po-input" value="Cash" readOnly />
                    </label>
                  </div>

                  <label className="po-field">
                    <span className="po-label">Note{cat.key === "other_in" || cat.key === "other_out" ? " *" : ""}</span>
                    <input className="po-input" value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={300}
                      placeholder={cat.key === "other_in" || cat.key === "other_out" ? "What is this for?" : "Optional"} />
                  </label>
                </>
              )}

              {error && (
                <div className="po-alert po-tone-danger" role="alert" style={{ marginTop: 16 }}>
                  <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
                </div>
              )}
              <button type="submit" hidden />
            </form>

            <div className="po-drawer-foot">
              <button type="button" className="po-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="button" className="po-btn po-btn--primary" onClick={submit} disabled={saving || !cat || (cat.key === "rent" && !!rent && rent.maxAmount <= 0)}>
                {saving ? <><Loader2 size={15} className="po-spin" />Saving…</> : cat?.direction === "out" ? "Save and print voucher" : "Save and print receipt"}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
