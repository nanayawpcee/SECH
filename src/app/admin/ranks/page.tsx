"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Award, Briefcase, Info, Loader2, Plus, RotateCcw, Save, Trash2, Users } from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { EmptyState, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { useStaff } from "@/components/admin/staff/useStaff";
import type { Cadre, StaffRanks } from "@/lib/staff";

const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Cadres with their rank ladders (junior to senior), and management positions. */
export default function RanksPage() {
  const { addToast } = useAdminData();
  const staff = useStaff();
  const [draft, setDraft] = useState<StaffRanks | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (staff.setup) setDraft(structuredClone(staff.setup.ranks));
  }, [staff.setup]);

  const dirty = useMemo(
    () => !!draft && !!staff.setup && JSON.stringify(draft) !== JSON.stringify(staff.setup.ranks),
    [draft, staff.setup],
  );

  // How many records use each thing; anything in use can't be removed.
  const usage = useMemo(() => {
    const count = (key: "cadreId" | "rankId" | "positionId") => {
      const m = new Map<string, number>();
      for (const e of staff.employees) {
        const v = e[key];
        if (v) m.set(v, (m.get(v) ?? 0) + 1);
      }
      return m;
    };
    return { cadres: count("cadreId"), ranks: count("rankId"), positions: count("positionId") };
  }, [staff.employees]);

  const updateCadre = (id: string, patch: Partial<Cadre>) =>
    setDraft((d) => d && { ...d, cadres: d.cadres.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  const save = async () => {
    if (!draft) return;
    const blank = draft.cadres.some((c) => !c.name.trim() || c.ranks.some((r) => !r.name.trim())) || draft.positions.some((p) => !p.name.trim());
    if (blank) return setError("Every cadre, rank and position needs a name.");
    setSaving(true);
    setError("");
    const r = await staff.saveRanks(draft);
    setSaving(false);
    if (!r.ok) return setError(r.error);
    addToast("Ranks and positions saved");
  };

  return (
    <>
      <PageHeader
        title="Ranks and positions"
        subtitle="Rank ladders for each cadre, and management positions"
        actions={
          <>
            <button type="button" className="ad-btn" disabled={!dirty || saving} onClick={() => { setDraft(staff.setup ? structuredClone(staff.setup.ranks) : null); setError(""); }}>
              <RotateCcw size={15} />Discard changes
            </button>
            <button type="button" className="ad-btn ad-btn--primary" disabled={!dirty || saving} onClick={save}>
              {saving ? <><Loader2 size={15} className="ad-spin" />Saving…</> : <><Save size={15} />Save changes</>}
            </button>
          </>
        }
      />

      {staff.needsPlugin && (
        <div className="ad-alert ad-tone-warn" role="status" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>WordPress needs the SECH Portal plugin version 1.7.0 before ranks can be managed.</span>
        </div>
      )}
      {(error || staff.error) && (
        <div className="ad-alert ad-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error || staff.error}</span>
        </div>
      )}
      {staff.loaded && !staff.needsPlugin && (
        <div className="ad-alert ad-tone-info" role="note" style={{ marginBottom: 16 }}>
          <Info size={17} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            These ladders started as a <strong>draft based on the Ghana Health Service scheme of service</strong>. Check them against the
            current MoH and Controller (CAGD) structure and correct any names or pay levels. List ranks from most junior to most senior.
          </span>
        </div>
      )}

      {!staff.loaded ? (
        <section className="ad-card"><SkeletonRows rows={6} cols={3} /></section>
      ) : !draft ? (
        <section className="ad-card"><EmptyState icon={Award} title="Nothing to show yet" /></section>
      ) : (
        <div className="st-stack">
          <div className="st-cadres">
            {draft.cadres.map((c) => {
              const inUse = usage.cadres.get(c.id) ?? 0;
              return (
                <section key={c.id} className="ad-card st-dept">
                  <header className="st-dept-head st-dept-head--simple">
                    <span className="st-dept-icon"><Award size={18} /></span>
                    <input className="ad-input st-name-input" value={c.name} onChange={(e) => updateCadre(c.id, { name: e.target.value })}
                      aria-label="Cadre name" placeholder="Cadre name, e.g. General Nursing" />
                    <span className="st-count" title="Staff in this cadre"><Users size={13} />{inUse}</span>
                    <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon" disabled={inUse > 0}
                      title={inUse ? "Staff are still in this cadre" : "Remove cadre"} aria-label={`Remove ${c.name}`}
                      onClick={() => setDraft((d) => d && { ...d, cadres: d.cadres.filter((x) => x.id !== c.id) })}>
                      <Trash2 size={15} />
                    </button>
                  </header>
                  <ol className="st-ranks">
                    {c.ranks.map((r, i) => {
                      const used = usage.ranks.get(r.id) ?? 0;
                      return (
                        <li key={r.id} className="st-rank">
                          <span className="st-rank-no">{i + 1}</span>
                          <input className="ad-input" value={r.name} aria-label="Rank name" placeholder="Rank name"
                            onChange={(e) => updateCadre(c.id, { ranks: c.ranks.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)) })} />
                          <input className="ad-input st-level" value={r.level} aria-label="Pay level" placeholder="Pay level"
                            onChange={(e) => updateCadre(c.id, { ranks: c.ranks.map((x) => (x.id === r.id ? { ...x, level: e.target.value } : x)) })} />
                          <span className="st-count" title="Staff on this rank"><Users size={13} />{used}</span>
                          <div className="st-rank-actions">
                            <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon ad-btn--sm" disabled={i === 0} aria-label="Move down in seniority"
                              onClick={() => updateCadre(c.id, { ranks: move(c.ranks, i, i - 1) })}><ArrowUp size={14} /></button>
                            <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon ad-btn--sm" disabled={i === c.ranks.length - 1} aria-label="Move up in seniority"
                              onClick={() => updateCadre(c.id, { ranks: move(c.ranks, i, i + 1) })}><ArrowDown size={14} /></button>
                            <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon ad-btn--sm" disabled={used > 0}
                              title={used ? "Staff still hold this rank" : "Remove rank"} aria-label={`Remove ${r.name}`}
                              onClick={() => updateCadre(c.id, { ranks: c.ranks.filter((x) => x.id !== r.id) })}><Trash2 size={14} /></button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost st-add"
                    onClick={() => updateCadre(c.id, { ranks: [...c.ranks, { id: newId("rank"), name: "", level: "" }] })}>
                    <Plus size={14} />Add rank
                  </button>
                </section>
              );
            })}
          </div>
          <button type="button" className="ad-btn st-add-dept"
            onClick={() => setDraft((d) => d && { ...d, cadres: [...d.cadres, { id: newId("cadre"), name: "", ranks: [] }] })}>
            <Plus size={15} />Add cadre
          </button>

          <section className="ad-card st-dept">
            <header className="st-dept-head st-dept-head--simple">
              <span className="st-dept-icon"><Briefcase size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "var(--ad-text)" }}>Management positions</div>
                <div className="ad-cell-sub">Hospital-level appointments held alongside a rank, e.g. Nurse Manager.</div>
              </div>
            </header>
            <ul className="st-ranks">
              {draft.positions.map((p) => {
                const used = usage.positions.get(p.id) ?? 0;
                return (
                  <li key={p.id} className="st-rank st-rank--position">
                    <input className="ad-input" value={p.name} aria-label="Position name" placeholder="Position name"
                      onChange={(e) => setDraft((d) => d && { ...d, positions: d.positions.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)) })} />
                    <span className="st-count" title="Staff holding it"><Users size={13} />{used}</span>
                    <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon ad-btn--sm" disabled={used > 0}
                      title={used ? "Someone holds this position" : "Remove position"} aria-label={`Remove ${p.name}`}
                      onClick={() => setDraft((d) => d && { ...d, positions: d.positions.filter((x) => x.id !== p.id) })}><Trash2 size={14} /></button>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost st-add"
              onClick={() => setDraft((d) => d && { ...d, positions: [...d.positions, { id: newId("position"), name: "" }] })}>
              <Plus size={14} />Add position
            </button>
          </section>
        </div>
      )}

      {dirty && (
        <div className="st-savebar" role="status">
          <span>You have unsaved changes.</span>
          <button type="button" className="ad-btn ad-btn--primary ad-btn--sm" onClick={save} disabled={saving}>
            {saving ? <><Loader2 size={14} className="ad-spin" />Saving…</> : <><Save size={14} />Save changes</>}
          </button>
        </div>
      )}
    </>
  );
}
