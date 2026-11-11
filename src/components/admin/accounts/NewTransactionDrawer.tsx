"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Loader2, X } from "lucide-react";
import {
  CATEGORIES,
  categoryOf,
  formatMoney,
  parseMoney,
  type AccAdvance,
  type AccStaffOption,
  type AccTenancy,
  type AccTransaction,
} from "@/lib/accounts";

export interface Preset {
  category?: string;
  advanceId?: number;
  tenancyId?: number;
}

const EMPTY = {
  category: "", party: "", phone: "", amount: "", description: "",
  advanceId: "", tenancyId: "", employeeId: "", monthly: "", purpose: "",
};

export function NewTransactionDrawer({
  open,
  preset,
  advances,
  tenancies,
  staff,
  onClose,
  onRecord,
}: {
  open: boolean;
  preset?: Preset | null;
  advances: AccAdvance[];
  tenancies: AccTenancy[];
  staff: AccStaffOption[];
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
      next.amount = t ? (t.monthlyRate / 100).toFixed(2) : "";
    }
    setForm(next);
    setDetails({});
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset]);

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const cat = categoryOf(form.category);
  const openAdvances = useMemo(() => advances.filter((a) => a.status === "outstanding"), [advances]);
  const activeTenancies = useMemo(() => tenancies.filter((t) => t.status === "active" || t.balance > 0), [tenancies]);
  const advance = advances.find((a) => String(a.databaseId) === form.advanceId);
  const tenancy = tenancies.find((t) => String(t.databaseId) === form.tenancyId);

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
    setForm((f) => ({ ...f, tenancyId: id, party: t?.tenantName ?? f.party, amount: t ? (t.monthlyRate / 100).toFixed(2) : f.amount }));
  };
  const pickStaff = (id: string) => {
    const s = staff.find((x) => String(x.id) === id);
    setForm((f) => ({ ...f, employeeId: id, party: s?.name ?? f.party }));
  };

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
      employeeId: form.employeeId ? Number(form.employeeId) : null,
      monthlyDeduction: parseMoney(form.monthly) ?? 0,
      purpose: form.purpose.trim() || null,
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
                      <option key={a.databaseId} value={a.databaseId}>{a.staffName}: {formatMoney(a.outstanding)} still owed</option>
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
                        {t.tenantName}{t.unit ? `, ${t.unit}` : ""}{t.balance > 0 ? `: ${formatMoney(t.balance)} owed` : ""}
                      </option>
                    ))}
                  </select>
                  {!activeTenancies.length && <span className="po-hint">Add tenancies on the Staff rent page first.</span>}
                </label>
              )}

              {cat?.key === "salary_advance" && staff.length > 0 && (
                <label className="po-field" style={{ marginBottom: 12 }}>
                  <span className="po-label">Staff member</span>
                  <select className="po-select" value={form.employeeId} onChange={(e) => pickStaff(e.target.value)}>
                    <option value="">Choose, or type the name below</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}{s.staffNumber ? ` (${s.staffNumber})` : ""}</option>)}
                  </select>
                </label>
              )}

              {cat && (
                <>
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
                        ) : (
                          <label key={f.key} className="po-field">
                            <span className="po-label">{f.label}{f.required ? " *" : ""}</span>
                            <input
                              className="po-input"
                              type={f.kind === "date" ? "date" : "text"}
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
                      <input className="po-input" inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00"
                        style={{ fontSize: 18, fontWeight: 700 }} />
                      {advance && <span className="po-hint">Still owed: {formatMoney(advance.outstanding)}</span>}
                      {tenancy && (
                        <span className="po-hint">
                          {formatMoney(tenancy.monthlyRate)} a month. {tenancy.balance > 0 ? `${formatMoney(tenancy.balance)} owed.` : "Up to date."}
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
              <button type="button" className="po-btn po-btn--primary" onClick={submit} disabled={saving || !cat}>
                {saving ? <><Loader2 size={15} className="po-spin" />Saving…</> : cat?.direction === "out" ? "Save and print voucher" : "Save and print receipt"}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
