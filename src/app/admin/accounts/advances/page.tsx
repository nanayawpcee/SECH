"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, HandCoins, Plus, Search, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import { useAdminData } from "@/context/AdminDataContext";
import { Chip, EmptyState, PageHeader, Segmented, SkeletonRows } from "@/components/admin/ui";
import { NewTransactionDrawer, type Preset } from "@/components/admin/accounts/NewTransactionDrawer";
import { dayKey, useAccounts } from "@/components/admin/accounts/useAccounts";
import { formatMoney, staffSubline } from "@/lib/accounts";

type Show = "outstanding" | "cleared" | "all";

export default function AdvancesPage() {
  const router = useRouter();
  const { addToast } = useAdminData();
  const [range] = useState(() => ({ from: dayKey(new Date()), to: dayKey(new Date()) }));
  const acc = useAccounts(range);
  const [show, setShow] = useState<Show>("outstanding");
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<Preset | null>(null);
  const { admin } = useAuth();
  const mayPayOut = can(admin?.perms, "accounts.payout");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return acc.advances.filter((a) =>
      a.status !== "voided" &&
      (show === "all" || a.status === show) &&
      (!q || [a.staffName, a.department ?? "", (a.ghanaCard ?? "").replace(/-/g, "")]
        .some((v) => v.toLowerCase().includes(q.replace(/-/g, "")))));
  }, [acc.advances, show, query]);

  const owed = acc.advances.filter((a) => a.status === "outstanding");
  const owedTotal = owed.reduce((s, a) => s + a.outstanding, 0);

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
        title="Salary advances"
        subtitle="Advances given to staff and what is still owed"
        actions={
          <>
            <Link href="/admin/accounts" className="po-btn"><ArrowLeft size={15} />Accounts</Link>
            {mayPayOut && (
              <button type="button" className="po-btn po-btn--primary" onClick={() => setDrawer({ category: "salary_advance" })} disabled={acc.needsPlugin}>
                <Plus size={15} />New advance
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
        <div className="po-card po-kpi po-tone-warn">
          <div className="po-kpi-top"><span className="po-kpi-label">Still owed</span><span className="po-kpi-icon"><Wallet size={17} /></span></div>
          <div className="po-kpi-value" style={{ fontSize: 22 }}>{acc.loaded ? formatMoney(owedTotal) : "…"}</div>
        </div>
        <div className="po-card po-kpi po-tone-info">
          <div className="po-kpi-top"><span className="po-kpi-label">Staff with an advance</span><span className="po-kpi-icon"><HandCoins size={17} /></span></div>
          <div className="po-kpi-value">{acc.loaded ? owed.length : "…"}</div>
        </div>
      </div>

      <section className="po-card">
        <div className="po-toolbar">
          <div className="po-input-wrap" style={{ flex: "1 1 220px", maxWidth: 320 }}>
            <Search size={15} />
            <input className="po-input" placeholder="Name, department or card no." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
          </div>
          <Segmented<Show>
            id="adv-show"
            ariaLabel="Show"
            value={show}
            onChange={setShow}
            options={[{ value: "outstanding", label: "Owing" }, { value: "cleared", label: "Cleared" }, { value: "all", label: "All" }]}
          />
        </div>
        {!acc.loaded ? (
          <div style={{ padding: 18 }}><SkeletonRows rows={5} cols={5} /></div>
        ) : list.length === 0 ? (
          <EmptyState icon={HandCoins} title="No advances here" text="Advances are recorded with “New advance”, which also prints the payment voucher." />
        ) : (
          <div className="po-table-wrap">
            <table className="po-table">
              <thead>
                <tr>
                  <th>Staff member</th><th>Given</th><th style={{ textAlign: "right" }}>Advance</th>
                  <th style={{ textAlign: "right" }}>Repaid</th><th style={{ textAlign: "right" }}>Owed</th><th />
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.databaseId}>
                    <td>
                      <div className="po-cell-main">{a.staffName}</div>
                      {staffSubline(a) && <div className="po-cell-sub">{staffSubline(a)}</div>}
                      {a.purpose && <div className="po-cell-sub">{a.purpose}</div>}
                    </td>
                    <td>
                      {new Date(`${a.dateGiven}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {a.monthlyDeduction > 0 && <div className="po-cell-sub">{formatMoney(a.monthlyDeduction)} a month</div>}
                    </td>
                    <td style={{ textAlign: "right" }}>{formatMoney(a.amount)}</td>
                    <td style={{ textAlign: "right" }}>{formatMoney(a.repaid)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {a.status === "cleared" ? <Chip tone="success">Cleared</Chip> : formatMoney(a.outstanding)}
                    </td>
                    <td>
                      {a.status === "outstanding" && (
                        <button type="button" className="po-btn po-btn--sm" onClick={() => setDrawer({ category: "advance_repayment", advanceId: a.databaseId })}>
                          Record repayment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
