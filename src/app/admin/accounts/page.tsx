"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  ClipboardList,
  Download,
  HandCoins,
  Home,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Wallet,
  FileBarChart,
} from "lucide-react";
import { useAdminData } from "@/context/AdminDataContext";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import { Card, Chip, ConfirmDialog, EmptyState, PageHeader, Segmented, SkeletonRows } from "@/components/admin/ui";
import { NewTransactionDrawer, type Preset } from "@/components/admin/accounts/NewTransactionDrawer";
import { dayKey, useAccounts } from "@/components/admin/accounts/useAccounts";
import { downloadCsv } from "@/lib/csv";
import { DatePicker } from "@/components/ui/DatePicker";
import { CATEGORIES, categoryLabel, detailRows, formatMoney, maskGhanaCard, staffSubline, type AccTransaction } from "@/lib/accounts";

type RangeKey = "today" | "week" | "month" | "custom";

function rangeFor(key: RangeKey, custom: { from: string; to: string }) {
  const now = new Date();
  const today = dayKey(now);
  if (key === "today") return { from: today, to: today };
  if (key === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return { from: dayKey(d), to: today };
  }
  if (key === "month") return { from: dayKey(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  return custom;
}

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AccountsPage() {
  const router = useRouter();
  const { addToast } = useAdminData();
  const { admin } = useAuth();
  const mayVoid = can(admin?.perms, "accounts.void");
  const mayReport = can(admin?.perms, "accounts.reports");
  const [rangeKey, setRangeKey] = useState<RangeKey>("today");
  const [custom, setCustom] = useState(() => {
    const t = dayKey(new Date());
    return { from: t, to: t };
  });
  const range = useMemo(() => rangeFor(rangeKey, custom), [rangeKey, custom]);
  const acc = useAccounts(range);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [showVoid, setShowVoid] = useState(false);
  const [drawer, setDrawer] = useState<Preset | null>(null);
  const [toVoid, setToVoid] = useState<AccTransaction | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const valid = useMemo(() => acc.transactions.filter((t) => t.status === "valid"), [acc.transactions]);
  const totals = useMemo(() => {
    const inn = valid.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0);
    const out = valid.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
    return { inn, out, net: inn - out, count: valid.length };
  }, [valid]);

  const byCategory = useMemo(() => {
    const m = new Map<string, { count: number; total: number }>();
    for (const t of valid) {
      const row = m.get(t.category) ?? { count: 0, total: 0 };
      row.count++;
      row.total += t.amount;
      m.set(t.category, row);
    }
    return CATEGORIES.filter((c) => m.has(c.key)).map((c) => ({ ...c, ...m.get(c.key)! }));
  }, [valid]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return acc.transactions.filter((t) =>
      (showVoid || t.status === "valid") &&
      (category === "all" || t.category === category) &&
      (!q || [t.receiptNo, t.manualRef ?? "", t.party, t.phone ?? "", t.cashier, t.description ?? "", t.department ?? "", t.ghanaCard ?? "",
        ...detailRows(t).map((r) => r[1])]
        .some((v) => v.toLowerCase().includes(q))),
    );
  }, [acc.transactions, query, category, showVoid]);

  const refresh = async () => { setRefreshing(true); await acc.reload(); setRefreshing(false); };

  const onRecord = useCallback(async (input: Record<string, unknown>) => {
    const r = await acc.record(input);
    if (r.ok) {
      setDrawer(null);
      addToast(`${r.value.receiptNo} saved`);
      router.push(`/admin/accounts/receipt/${r.value.databaseId}?print=1`);
    }
    return r;
  }, [acc, addToast, router]);

  const doVoid = async () => {
    if (!toVoid) return;
    if (voidReason.trim().length < 5) return addToast("Give a reason for voiding.", "warn");
    setVoiding(true);
    const r = await acc.voidTxn(toVoid.databaseId, voidReason.trim());
    setVoiding(false);
    if (!r.ok) return addToast(r.error, "danger");
    addToast(`${toVoid.receiptNo} voided`);
    setToVoid(null);
    setVoidReason("");
  };

  const exportCsv = async () => {
    const label = `${range.from} to ${range.to}`;
    const r = await acc.logExport(shown.length, label);
    if (!r.ok) return addToast(r.error, "danger");
    downloadCsv(`sech-accounts-${range.from}-to-${range.to}.csv`,
      ["Receipt no", "Hospital voucher no", "Date", "In/Out", "Category", "Received from / paid to", "Department or unit", "Ghana Card (masked)", "Phone",
        "Amount (GHS)", "Details", "Note", "Cashier", "Status", "Void reason"],
      shown.map((t) => [
        t.receiptNo, t.manualRef ?? "", new Date(t.createdAt).toLocaleString("en-GB"), t.direction === "in" ? "In" : "Out", categoryLabel(t.category),
        t.party, t.department ?? "", maskGhanaCard(t.ghanaCard), t.phone ?? "", (t.amount / 100).toFixed(2), detailRows(t).map(([k, v]) => `${k}: ${v}`).join("; "),
        t.description ?? "", t.cashier, t.status === "voided" ? "Void" : "Valid", t.voidReason ?? "",
      ]));
    addToast(`Exported ${shown.length} record${shown.length === 1 ? "" : "s"}. Keep the file safe and delete it when done.`);
  };

  const closeVoid = useCallback(() => { setToVoid(null); setVoidReason(""); }, []);

  return (
    <>
      <PageHeader
        title="Accounts office"
        subtitle="Internal collections and payments, cash only. Not for patient medical bills."
        actions={
          <>
            <button type="button" className="po-btn" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "po-spin" : ""} />Refresh
            </button>
            {mayReport && <button type="button" className="po-btn" onClick={exportCsv} disabled={!shown.length}><Download size={15} />Export</button>}
            <button type="button" className="po-btn po-btn--primary" onClick={() => setDrawer({})} disabled={acc.needsPlugin}>
              <Receipt size={15} />New receipt
            </button>
          </>
        }
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <Link href="/admin/accounts/advances" className="po-btn po-btn--sm"><HandCoins size={14} />Salary advances</Link>
        <Link href="/admin/accounts/rent" className="po-btn po-btn--sm"><Home size={14} />Staff rent</Link>
        {mayReport && <Link href="/admin/accounts/reports" className="po-btn po-btn--sm"><FileBarChart size={14} />Reports</Link>}
        {acc.canAudit && <Link href="/admin/accounts/activity" className="po-btn po-btn--sm"><ClipboardList size={14} />Activity log</Link>}
      </div>

      {acc.needsPlugin && (
        <div className="po-alert po-tone-warn" role="note" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0 }} />
          <span>Install SECH Portal plugin 1.14.0 on WordPress to turn on the accounts office (it adds Ghana Card numbers and departments for staff).</span>
        </div>
      )}
      {acc.error && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0 }} /><span>{acc.error}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <Segmented<RangeKey>
          id="acc-range"
          ariaLabel="Period"
          value={rangeKey}
          onChange={setRangeKey}
          options={[
            { value: "today", label: "Today" },
            { value: "week", label: "This week" },
            { value: "month", label: "This month" },
            { value: "custom", label: "Dates" },
          ]}
        />
        {rangeKey === "custom" && (
          <>
            <div style={{ width: 170 }}>
              <DatePicker value={custom.from} max={custom.to} ariaLabel="From" clearable={false}
                onChange={(v) => setCustom((c) => ({ ...c, from: v }))} />
            </div>
            <span className="po-cell-sub">to</span>
            <div style={{ width: 170 }}>
              <DatePicker value={custom.to} min={custom.from} ariaLabel="To" clearable={false}
                onChange={(v) => setCustom((c) => ({ ...c, to: v }))} />
            </div>
          </>
        )}
      </div>

      <div className="po-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", marginBottom: 16 }}>
        {[
          { label: "Collected", value: formatMoney(totals.inn), icon: ArrowDownLeft, tone: "success" },
          { label: "Paid out", value: formatMoney(totals.out), icon: ArrowUpRight, tone: "warn" },
          { label: "Cash in hand", value: formatMoney(totals.net), icon: Wallet, tone: "brand" },
          { label: "Receipts and vouchers", value: String(totals.count), icon: Receipt, tone: "info" },
        ].map((k) => (
          <div key={k.label} className={`po-card po-kpi po-tone-${k.tone}`}>
            <div className="po-kpi-top">
              <span className="po-kpi-label">{k.label}</span>
              <span className="po-kpi-icon"><k.icon size={17} /></span>
            </div>
            <div className="po-kpi-value" style={{ fontSize: 22 }}>{acc.loaded ? k.value : "…"}</div>
          </div>
        ))}
      </div>

      <section className="po-card">
        <div className="po-toolbar">
          <div className="po-input-wrap" style={{ flex: "1 1 240px", maxWidth: 340 }}>
            <Search size={15} />
            <input className="po-input" placeholder="Receipt no., name, phone, card no." value={query}
              onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
          </div>
          <select className="po-select" style={{ width: 260 }} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            <input type="checkbox" checked={showVoid} onChange={(e) => setShowVoid(e.target.checked)} />Show voided
          </label>
        </div>

        {!acc.loaded ? (
          <div style={{ padding: 18 }}><SkeletonRows rows={6} cols={5} /></div>
        ) : shown.length === 0 ? (
          <EmptyState icon={Receipt} title="Nothing recorded for this period" text="New receipts and payment vouchers will show here." />
        ) : (
          <div className="po-table-wrap">
            <table className="po-table">
              <thead>
                <tr><th>Receipt</th><th>Category</th><th>From / to</th><th style={{ textAlign: "right" }}>Amount</th><th>Cashier</th><th /></tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.databaseId} style={t.status === "voided" ? { opacity: 0.55 } : undefined}>
                    <td>
                      <div className="po-cell-main" style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{t.receiptNo}</div>
                      {t.manualRef && <div className="po-cell-sub" style={{ fontFamily: "ui-monospace, monospace" }}>Hospital PV {t.manualRef}</div>}
                      <div className="po-cell-sub">{when(t.createdAt)}</div>
                    </td>
                    <td>
                      {categoryLabel(t.category)}
                      {t.status === "voided" && <div style={{ marginTop: 4 }}><Chip tone="danger">Void</Chip></div>}
                    </td>
                    <td>
                      <div className="po-cell-main">{t.party}</div>
                      {staffSubline(t)
                        ? <div className="po-cell-sub">{staffSubline(t)}</div>
                        : detailRows(t)[0] && <div className="po-cell-sub">{detailRows(t)[0][1]}</div>}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", color: t.direction === "in" ? "var(--po-success)" : "var(--po-warn)" }}>
                      {t.direction === "in" ? "+" : "−"} {formatMoney(t.amount)}
                    </td>
                    <td>{t.cashier}</td>
                    <td>
                      <div className="po-row-actions">
                        <Link href={`/admin/accounts/receipt/${t.databaseId}`} className="po-btn po-btn--sm po-btn--ghost" aria-label={`Print ${t.receiptNo}`}>
                          <Printer size={14} />
                        </Link>
                        {t.status === "valid" && mayVoid && (
                          <button type="button" className="po-btn po-btn--sm po-btn--ghost" onClick={() => setToVoid(t)} aria-label={`Void ${t.receiptNo}`}>
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {byCategory.length > 0 && (
        <Card title="By category" icon={ClipboardList} subtitle="Valid receipts and vouchers in this period" style={{ marginTop: 16 }} bodyClassName="">
          <div className="po-table-wrap">
            <table className="po-table">
              <thead><tr><th>Category</th><th>Count</th><th style={{ textAlign: "right" }}>Total</th></tr></thead>
              <tbody>
                {byCategory.map((c) => (
                  <tr key={c.key}>
                    <td>{c.label} {c.direction === "out" && <Chip tone="warn">Out</Chip>}</td>
                    <td>{c.count}</td>
                    <td style={{ textAlign: "right", fontWeight: 650 }}>{formatMoney(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <NewTransactionDrawer
        open={!!drawer}
        preset={drawer}
        advances={acc.advances}
        tenancies={acc.tenancies}
        transactions={acc.transactions}
        departments={acc.departments}
        onClose={() => setDrawer(null)}
        onRecord={onRecord}
      />

      <ConfirmDialog
        open={!!toVoid}
        title={`Void ${toVoid?.receiptNo ?? ""}?`}
        icon={Ban}
        busy={voiding}
        confirmLabel="Void"
        text={<>
          <p style={{ margin: "0 0 10px" }}>
            {toVoid ? `${categoryLabel(toVoid.category)}, ${formatMoney(toVoid.amount)}, ${toVoid.party}.` : ""} The record stays, marked void,
            and no longer counts in the totals. This can’t be undone.
          </p>
          <textarea className="po-input" rows={3} placeholder="Reason, e.g. wrong amount entered" value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)} maxLength={300} aria-label="Reason for voiding" style={{ width: "100%" }} />
        </>}
        onConfirm={doVoid}
        onCancel={closeVoid}
      />
    </>
  );
}
