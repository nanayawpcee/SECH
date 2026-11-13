"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Building2, Home, Loader2, Pencil, Plus, Search, Trash2, Wallet, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import { useAdminData } from "@/context/AdminDataContext";
import { Card, Chip, EmptyState, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { NewTransactionDrawer, type Preset } from "@/components/admin/accounts/NewTransactionDrawer";
import { dayKey, useAccounts } from "@/components/admin/accounts/useAccounts";
import {
  formatMoney, knownStaff, monthLabel, normalizeGhanaCard, parseMoney, staffSubline,
  type AccDepartment, type AccHousingType, type AccTenancy, type StaffPerson,
} from "@/lib/accounts";
import { StaffIdentityFields, staffIdentityProblem } from "@/components/admin/accounts/StaffIdentityFields";
import { MonthPicker } from "@/components/ui/DatePicker";

const thisMonth = () => dayKey(new Date()).slice(0, 7);

export default function RentPage() {
  const router = useRouter();
  const { addToast } = useAdminData();
  const [range] = useState(() => ({ from: dayKey(new Date()), to: dayKey(new Date()) }));
  const acc = useAccounts(range);
  const [query, setQuery] = useState("");
  const [showEnded, setShowEnded] = useState(false);
  const [drawer, setDrawer] = useState<Preset | null>(null);
  const [editing, setEditing] = useState<AccTenancy | "new" | null>(null);
  const { admin } = useAuth();
  // adding or changing tenancies and housing types; collecting rent is open to every accounts officer
  const maySetUp = can(admin?.perms, "accounts.rent");

  const typeName = useMemo(() => new Map(acc.housingTypes.map((t) => [t.id, t.name])), [acc.housingTypes]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return acc.tenancies.filter((t) =>
      (showEnded || t.status === "active") &&
      (!q || [t.tenantName, t.unit ?? "", typeName.get(t.housingTypeId) ?? "", t.department ?? "", t.ghanaCard ?? ""]
        .some((v) => v.toLowerCase().includes(q))));
  }, [acc.tenancies, query, showEnded, typeName]);

  const arrears = acc.tenancies.filter((t) => t.balance > 0);
  const arrearsTotal = arrears.reduce((s, t) => s + t.balance, 0);

  const onRecord = useCallback(async (input: Record<string, unknown>) => {
    const r = await acc.record(input);
    if (r.ok) {
      setDrawer(null);
      addToast(`${r.value.receiptNo} saved`);
      router.push(`/admin/accounts/receipt/${r.value.databaseId}?print=1`);
    }
    return r;
  }, [acc, addToast, router]);

  return (
    <>
      <PageHeader
        title="Staff rent"
        subtitle="Hospital housing let to staff, rates and who is behind"
        actions={
          <>
            <Link href="/admin/accounts" className="po-btn"><ArrowLeft size={15} />Accounts</Link>
            {maySetUp && (
              <button type="button" className="po-btn po-btn--primary" onClick={() => setEditing("new")} disabled={acc.needsPlugin || !acc.housingTypes.length}>
                <Plus size={15} />Add tenancy
              </button>
            )}
          </>
        }
      />

      {acc.error && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0 }} /><span>{acc.error}</span>
        </div>
      )}

      <div className="po-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 16 }}>
        <div className="po-card po-kpi po-tone-danger">
          <div className="po-kpi-top"><span className="po-kpi-label">Rent in arrears</span><span className="po-kpi-icon"><Wallet size={17} /></span></div>
          <div className="po-kpi-value" style={{ fontSize: 22 }}>{acc.loaded ? formatMoney(arrearsTotal) : "…"}</div>
        </div>
        <div className="po-card po-kpi po-tone-info">
          <div className="po-kpi-top"><span className="po-kpi-label">Tenants behind</span><span className="po-kpi-icon"><Home size={17} /></span></div>
          <div className="po-kpi-value">{acc.loaded ? arrears.length : "…"}</div>
        </div>
      </div>

      <HousingTypes types={acc.housingTypes} loaded={acc.loaded} onSave={acc.saveHousingTypes} canEdit={maySetUp} />

      <section className="po-card" style={{ marginTop: 16 }}>
        <div className="po-toolbar">
          <div className="po-input-wrap" style={{ flex: "1 1 220px", maxWidth: 320 }}>
            <Search size={15} />
            <input className="po-input" placeholder="Tenant, house, department or card no." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
          </div>
          <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" checked={showEnded} onChange={(e) => setShowEnded(e.target.checked)} />Show ended tenancies
          </label>
        </div>
        {!acc.loaded ? (
          <div style={{ padding: 18 }}><SkeletonRows rows={5} cols={5} /></div>
        ) : list.length === 0 ? (
          <EmptyState icon={Home} title="No tenancies yet" text={acc.housingTypes.length ? "Add each staff tenant with “Add tenancy”." : "Add the housing types and their monthly rates first."} />
        ) : (
          <div className="po-table-wrap">
            <table className="po-table">
              <thead>
                <tr>
                  <th>Tenant</th><th>Housing</th><th style={{ textAlign: "right" }}>Monthly</th>
                  <th style={{ textAlign: "right" }}>Due to date</th><th style={{ textAlign: "right" }}>Paid</th>
                  <th style={{ textAlign: "right" }}>Balance</th><th />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.databaseId}>
                    <td>
                      <div className="po-cell-main">{t.tenantName}</div>
                      {staffSubline(t) && <div className="po-cell-sub">{staffSubline(t)}</div>}
                      <div className="po-cell-sub">Since {monthLabel(t.startMonth)}{t.endMonth ? `, until ${monthLabel(t.endMonth)}` : ""}</div>
                    </td>
                    <td>
                      {typeName.get(t.housingTypeId) ?? t.housingTypeId}
                      {t.unit && <div className="po-cell-sub">{t.unit}</div>}
                    </td>
                    <td style={{ textAlign: "right" }}>{formatMoney(t.monthlyRate)}</td>
                    <td style={{ textAlign: "right" }}>
                      {formatMoney(t.totalDue)}
                      <div className="po-cell-sub">{t.monthsDue} month{t.monthsDue === 1 ? "" : "s"}</div>
                    </td>
                    <td style={{ textAlign: "right" }}>{formatMoney(t.paid)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {t.balance > 0 ? <span style={{ color: "var(--po-danger)" }}>{formatMoney(t.balance)}</span>
                        : t.balance < 0 ? <Chip tone="success">{formatMoney(-t.balance)} ahead</Chip>
                        : <Chip tone="success">Up to date</Chip>}
                      {t.status === "ended" && <div style={{ marginTop: 4 }}><Chip tone="muted">Ended</Chip></div>}
                    </td>
                    <td>
                      <div className="po-row-actions">
                        <button type="button" className="po-btn po-btn--sm" onClick={() => setDrawer({ category: "rent", tenancyId: t.databaseId })}>
                          Collect rent
                        </button>
                        {maySetUp && <button type="button" className="po-btn po-btn--sm po-btn--ghost" onClick={() => setEditing(t)} aria-label={`Edit ${t.tenantName}`}>
                          <Pencil size={14} />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <TenancyDrawer
        tenancy={editing}
        types={acc.housingTypes}
        departments={acc.departments}
        people={knownStaff(acc.advances, acc.tenancies.filter((t) => editing === "new" || t.databaseId !== editing?.databaseId))}
        onClose={() => setEditing(null)}
        onSave={async (input) => {
          const r = await acc.saveTenancy(input);
          if (r.ok) {
            addToast(editing === "new" ? `Tenancy added for ${r.value.tenantName}` : "Tenancy updated");
            setEditing(null);
          }
          return r.ok ? null : r.error;
        }}
      />

      <NewTransactionDrawer
        open={!!drawer}
        preset={drawer}
        advances={acc.advances}
        tenancies={acc.tenancies}
        departments={acc.departments}
        onClose={() => setDrawer(null)}
        onRecord={onRecord}
      />
    </>
  );
}

function HousingTypes({ types, loaded, onSave, canEdit }: {
  types: AccHousingType[];
  loaded: boolean;
  canEdit: boolean;
  onSave: (t: AccHousingType[]) => Promise<{ ok: true; value: AccHousingType[] } | { ok: false; error: string }>;
}) {
  const { addToast } = useAdminData();
  // key: stable per row on screen, so new rows added at the top keep their inputs
  const [rows, setRows] = useState<{ key: string; id: string; name: string; rate: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const nextKey = useRef(0);
  useEffect(() => { setRows(types.map((t) => ({ key: t.id, id: t.id, name: t.name, rate: (t.monthlyRate / 100).toFixed(2) }))); }, [types]);
  const addRow = () => setRows((rs) => [{ key: `new-${nextKey.current++}`, id: "", name: "", rate: "" }, ...rs]);
  const dirty = JSON.stringify(rows.map((r) => [r.id, r.name, r.rate])) !== JSON.stringify(types.map((t) => [t.id, t.name, (t.monthlyRate / 100).toFixed(2)]));

  const save = async () => {
    const clean: AccHousingType[] = [];
    for (const r of rows) {
      if (!r.name.trim()) continue;
      const rate = r.rate.trim() === "" || r.rate.trim() === "0" ? 0 : parseMoney(r.rate);
      if (rate === null) return addToast(`Check the rate for “${r.name}”.`, "warn");
      clean.push({ id: r.id, name: r.name.trim(), monthlyRate: rate });
    }
    setSaving(true);
    const res = await onSave(clean);
    setSaving(false);
    addToast(res.ok ? "Housing types saved" : res.error, res.ok ? "success" : "danger");
  };

  return (
    <Card
      title="Housing types and rates"
      icon={Building2}
      subtitle="Rent depends on the kind of housing. Changing a rate here doesn't change existing tenancies."
      action={canEdit ? <button type="button" className="po-btn po-btn--primary po-btn--sm" onClick={save} disabled={!dirty || saving}>{saving ? "Saving…" : "Save"}</button> : undefined}
    >
      {!loaded ? <SkeletonRows rows={2} cols={2} /> : !canEdit ? (
        <div style={{ display: "grid", gap: 6 }}>
          {types.length ? types.map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 2px", borderBottom: "1px solid var(--po-border)" }}>
              <span>{t.name}</span><strong>{formatMoney(t.monthlyRate)} a month</strong>
            </div>
          )) : <span className="po-hint">No housing types yet. An administrator or someone with rent setup access adds them.</span>}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <button type="button" className="po-btn po-btn--sm" style={{ justifySelf: "start", marginBottom: 4 }} onClick={addRow}>
            <Plus size={14} />Add housing type
          </button>
          {rows.map((r, i) => (
            <div key={r.key} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 150px auto", gap: 8 }}>
              <input className="po-input" placeholder="e.g. Two-bedroom flat" value={r.name} aria-label="Housing type"
                autoFocus={!r.id}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className="po-input" inputMode="decimal" placeholder="Monthly GHS" value={r.rate} aria-label="Monthly rate in cedis"
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, rate: e.target.value } : x)))} />
              <button type="button" className="po-btn po-btn--ghost po-btn--icon" aria-label={`Remove ${r.name || "row"}`}
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TenancyDrawer({ tenancy, types, departments, people, onClose, onSave }: {
  tenancy: AccTenancy | "new" | null;
  types: AccHousingType[];
  departments: AccDepartment[];
  /** staff on record, leaving out this tenancy */
  people: StaffPerson[];
  onClose: () => void;
  onSave: (input: Record<string, unknown>) => Promise<string | null>;
}) {
  const open = tenancy !== null;
  const existing = tenancy && tenancy !== "new" ? tenancy : null;
  const blank = { tenantName: "", ghanaCard: "", department: "", housingTypeId: "", unit: "", rate: "", startMonth: thisMonth(), endMonth: "" };
  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setF(existing
      ? { tenantName: existing.tenantName, ghanaCard: existing.ghanaCard ?? "", department: existing.department ?? "", housingTypeId: existing.housingTypeId,
          unit: existing.unit ?? "", rate: (existing.monthlyRate / 100).toFixed(2), startMonth: existing.startMonth, endMonth: existing.endMonth ?? "" }
      : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenancy]);

  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    setError("");
    const who = staffIdentityProblem({ name: f.tenantName, ghanaCard: f.ghanaCard, department: f.department }, "tenant");
    if (who) return setError(who);
    if (!f.housingTypeId) return setError("Choose the housing type.");
    const rate = f.rate.trim() === "0" ? 0 : parseMoney(f.rate);
    if (rate === null) return setError("Enter the monthly rent in cedis.");
    if (f.endMonth && f.endMonth < f.startMonth) return setError("The end month is before the start month.");
    setSaving(true);
    const problem = await onSave({
      id: existing?.databaseId, tenantName: f.tenantName.trim(), employeeId: existing?.employeeId ?? null,
      ghanaCard: normalizeGhanaCard(f.ghanaCard), department: f.department.trim(),
      housingTypeId: f.housingTypeId, unit: f.unit.trim(), monthlyRate: rate, startMonth: f.startMonth, endMonth: f.endMonth || null,
    });
    setSaving(false);
    if (problem) setError(problem);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="po-overlay po-drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: "none" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
          <motion.aside className="po-drawer st-drawer" role="dialog" aria-modal="true" aria-label={existing ? "Edit tenancy" : "Add tenancy"}
            initial={{ x: "100%" }} animate={{ x: "0%" }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }}>
            <div className="po-drawer-head">
              <div style={{ fontSize: 17, fontWeight: 750, color: "var(--po-text)" }}>{existing ? "Edit tenancy" : "Add tenancy"}</div>
              <button type="button" className="po-btn po-btn--ghost po-btn--icon" onClick={onClose} aria-label="Close" disabled={saving}><X size={18} /></button>
            </div>
            <form className="po-drawer-body st-form" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
              <h3 className="st-h">Tenant</h3>
              <StaffIdentityFields
                value={{ name: f.tenantName, ghanaCard: f.ghanaCard, department: f.department }}
                onChange={(p) => setF((x) => ({
                  ...x,
                  ...(p.name !== undefined ? { tenantName: p.name } : {}),
                  ...(p.ghanaCard !== undefined ? { ghanaCard: p.ghanaCard } : {}),
                  ...(p.department !== undefined ? { department: p.department } : {}),
                }))}
                people={people}
                departments={departments}
                nameLabel="Tenant"
              />
              {existing && !existing.ghanaCard && (
                <p className="po-hint" style={{ marginTop: 8 }}>Added before card numbers were kept. Fill them in and save.</p>
              )}

              <h3 className="st-h">Housing</h3>
              <div className="st-grid">
                <label className="po-field">
                  <span className="po-label">Housing type *</span>
                  <select className="po-select" value={f.housingTypeId} onChange={(e) => {
                    const t = types.find((x) => x.id === e.target.value);
                    setF((x) => ({ ...x, housingTypeId: e.target.value, rate: t && !existing ? (t.monthlyRate / 100).toFixed(2) : x.rate }));
                  }}>
                    <option value="">Choose…</option>
                    {types.map((t) => <option key={t.id} value={t.id}>{t.name} ({formatMoney(t.monthlyRate)})</option>)}
                  </select>
                </label>
                <label className="po-field">
                  <span className="po-label">House or room</span>
                  <input className="po-input" value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="e.g. Block B, Room 4" maxLength={60} />
                </label>
              </div>
              <div className="st-grid">
                <label className="po-field">
                  <span className="po-label">Monthly rent (GHS) *</span>
                  <input className="po-input" inputMode="decimal" value={f.rate} onChange={(e) => set("rate", e.target.value)} />
                </label>
                <div />
                <label className="po-field">
                  <span className="po-label">Rent starts *</span>
                  <MonthPicker value={f.startMonth} onChange={(v) => set("startMonth", v)} clearable={false} ariaLabel="Rent starts" />
                </label>
                <label className="po-field">
                  <span className="po-label">Rent ends</span>
                  <MonthPicker value={f.endMonth} onChange={(v) => set("endMonth", v)} min={f.startMonth || undefined}
                    placeholder="Still living there" ariaLabel="Rent ends" />
                  <span className="po-hint">Set when they move out. Blank while they live there.</span>
                </label>
              </div>
              {error && (
                <div className="po-alert po-tone-danger" role="alert" style={{ marginTop: 16 }}>
                  <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
                </div>
              )}
              <button type="submit" hidden />
            </form>
            <div className="po-drawer-foot">
              <button type="button" className="po-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="button" className="po-btn po-btn--primary" onClick={save} disabled={saving}>
                {saving ? <><Loader2 size={15} className="po-spin" />Saving…</> : existing ? "Save changes" : "Add tenancy"}
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
