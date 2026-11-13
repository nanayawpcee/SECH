"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CalendarDays, FileSpreadsheet, HandCoins, Home, Printer, ReceiptText, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdminData } from "@/context/AdminDataContext";
import { EmptyState, PageHeader, SkeletonRows } from "@/components/admin/ui";
import { can } from "@/lib/permissions";
import { dayKey, useAccounts } from "@/components/admin/accounts/useAccounts";
import { DatePicker } from "@/components/ui/DatePicker";
import { SITE } from "@/lib/data";
import { formatMoney } from "@/lib/accounts";
import {
  advancesReport, dailyReport, periodReport, rentReport, reportSheets, REPORT_KINDS,
  type Cell, type Col, type Report, type ReportKind,
} from "@/lib/accounts-reports";
import { downloadXlsx } from "@/lib/xlsx";

const ICONS = { daily: ReceiptText, period: CalendarDays, advances: HandCoins, rent: Home };
// wide tables go across the page
const LANDSCAPE: ReportKind[] = ["advances", "rent"];

const fmt = (v: Cell, kind: Col["kind"]) =>
  v === null || v === "" ? "" : kind === "money" && typeof v === "number" ? formatMoney(v, false) : String(v);

export default function AccountsReportsPage() {
  const { admin } = useAuth();
  const { addToast } = useAdminData();
  const today = dayKey(new Date());
  const [kind, setKind] = useState<ReportKind>("daily");
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState(today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const [owingOnly, setOwingOnly] = useState(true);
  const [withEnded, setWithEnded] = useState(false);

  const range = useMemo(
    () => (kind === "daily" ? { from: date, to: date } : kind === "period" ? { from, to } : { from: today, to: today }),
    [kind, date, from, to, today],
  );
  const acc = useAccounts(range);

  const report: Report | null = useMemo(() => {
    if (!acc.loaded) return null;
    if (kind === "daily") return dailyReport(acc.transactions, date);
    if (kind === "period") return periodReport(acc.transactions, from, to);
    if (kind === "advances") return advancesReport(acc.advances, owingOnly, today);
    return rentReport(acc.tenancies, acc.housingTypes, !withEnded, today);
  }, [acc.loaded, acc.transactions, acc.advances, acc.tenancies, acc.housingTypes, kind, date, from, to, owingOnly, withEnded, today]);

  const generatedAt = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const generatedBy = admin?.name ?? "";

  const downloadExcel = async () => {
    if (!report) return;
    // logged first: the plugin refuses anyone without reports access, and then nothing is downloaded
    const r = await acc.logExport(report.count, `${report.title}, ${report.period} (Excel report)`);
    if (!r.ok) return addToast(r.error, "danger");
    downloadXlsx(report.fileName, reportSheets(report, { hospital: SITE.name, generatedBy, generatedAt }));
    addToast("Excel report downloaded. Keep the file safe and delete it when done.");
  };

  if (admin && !can(admin.perms, "accounts.reports")) {
    return (
      <>
        <PageHeader title="Reports" subtitle="Accounts office reports" actions={<Link href="/admin/accounts" className="po-btn"><ArrowLeft size={15} />Accounts</Link>} />
        <EmptyState icon={ShieldAlert} title="No access to reports" text="Ask an administrator to give you reports and exports access in Settings, Team." />
      </>
    );
  }

  const landscape = LANDSCAPE.includes(kind);

  return (
    <>
      <style>{REPORT_CSS + `@media print { @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 12mm; } }`}</style>

      <div className="rp-noprint">
        <PageHeader
          title="Reports"
          subtitle="Accounts office reports to print, save as PDF or open in Excel"
          actions={
            <>
              <Link href="/admin/accounts" className="po-btn"><ArrowLeft size={15} />Accounts</Link>
              <button type="button" className="po-btn" onClick={downloadExcel} disabled={!report}><FileSpreadsheet size={15} />Excel</button>
              <button type="button" className="po-btn po-btn--primary" onClick={() => window.print()} disabled={!report}><Printer size={15} />Print or PDF</button>
            </>
          }
        />

        <div className="rp-kinds" role="radiogroup" aria-label="Report">
          {REPORT_KINDS.map((k) => {
            const Icon = ICONS[k.id];
            return (
              <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} className="rp-kind" onClick={() => setKind(k.id)}>
                <span className="rp-kind-icon"><Icon size={17} /></span>
                <span><strong>{k.label}</strong><small>{k.hint}</small></span>
              </button>
            );
          })}
        </div>

        <div className="rp-controls">
          {kind === "daily" && (
            <label className="po-field" style={{ width: 200 }}>
              <span className="po-label">Day</span>
              <DatePicker value={date} max={today} ariaLabel="Day" clearable={false} onChange={setDate} />
            </label>
          )}
          {kind === "period" && (
            <>
              <label className="po-field" style={{ width: 180 }}>
                <span className="po-label">From</span>
                <DatePicker value={from} max={to} ariaLabel="From" clearable={false} onChange={setFrom} />
              </label>
              <label className="po-field" style={{ width: 180 }}>
                <span className="po-label">To</span>
                <DatePicker value={to} min={from} max={today} ariaLabel="To" clearable={false} onChange={setTo} />
              </label>
            </>
          )}
          {kind === "advances" && (
            <label className="rp-check"><input type="checkbox" checked={owingOnly} onChange={(e) => setOwingOnly(e.target.checked)} />Only advances still owed</label>
          )}
          {kind === "rent" && (
            <label className="rp-check"><input type="checkbox" checked={withEnded} onChange={(e) => setWithEnded(e.target.checked)} />Include ended tenancies</label>
          )}
          <span className="po-hint" style={{ marginLeft: "auto" }}>
            Prints on A4 {landscape ? "landscape" : "portrait"}. To save a PDF, choose “Save as PDF” as the printer.
          </span>
        </div>

        {acc.error && (
          <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
            <AlertTriangle size={17} style={{ flexShrink: 0 }} /><span>{acc.error}</span>
          </div>
        )}
      </div>

      {!report ? (
        <div className="po-card" style={{ padding: 20 }}><SkeletonRows rows={6} cols={4} /></div>
      ) : (
        <div className="rp-scroll">
          <article className={`rp-sheet${landscape ? " rp-wide" : ""}`}>
            <header className="rp-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="" width={56} height={56} />
              <div style={{ flex: 1 }}>
                <div className="rp-hospital">{SITE.name.toUpperCase()}</div>
                <div className="rp-sub">Hwidiem, Ahafo Region | Accounts office</div>
              </div>
              <div className="rp-meta">
                <div>Generated {generatedAt}</div>
                {generatedBy && <div>by {generatedBy}</div>}
              </div>
            </header>
            <h1 className="rp-title">{report.title}</h1>
            <div className="rp-period">{report.period}</div>

            {report.sections.map((s, i) =>
              s.type === "stats" ? (
                <div key={i} className="rp-stats" style={{ gridTemplateColumns: `repeat(${s.items.length <= 4 ? s.items.length : 3}, minmax(0, 1fr))` }}>
                  {s.items.map((it) => (
                    <div key={it.label} className="rp-stat">
                      <span>{it.label}</span>
                      <strong>{it.kind === "money" ? formatMoney(it.value) : it.value}</strong>
                      {it.note && <small>{it.note}</small>}
                    </div>
                  ))}
                </div>
              ) : (
                <section key={i} className="rp-section">
                  <h2>{s.title}</h2>
                  {!s.rows.length ? (
                    <p className="rp-empty">{s.empty ?? "Nothing to show."}</p>
                  ) : (
                    <table className="rp-table">
                      <thead>
                        <tr>{s.cols.map((c) => <th key={c.label} className={c.kind && c.kind !== "text" ? "num" : ""}>{c.label}</th>)}</tr>
                      </thead>
                      <tbody>
                        {s.rows.map((row, r) => (
                          <tr key={r}>{row.map((v, c) => <td key={c} className={s.cols[c]?.kind && s.cols[c].kind !== "text" ? "num" : ""}>{fmt(v, s.cols[c]?.kind)}</td>)}</tr>
                        ))}
                      </tbody>
                      {s.total && (
                        <tfoot>
                          <tr>{s.total.map((v, c) => <td key={c} className={s.cols[c]?.kind && s.cols[c].kind !== "text" ? "num" : ""}>{fmt(v, s.cols[c]?.kind)}</td>)}</tr>
                        </tfoot>
                      )}
                    </table>
                  )}
                </section>
              ),
            )}

            {report.signOff && (
              <div className="rp-sign">
                {report.signOff.map((who) => (
                  <div key={who}><span />{who}<small>Name, signature and date</small></div>
                ))}
              </div>
            )}
          </article>
        </div>
      )}
    </>
  );
}

const REPORT_CSS = `
.rp-kinds { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-bottom: 14px; }
.rp-kind { display: flex; gap: 12px; align-items: flex-start; text-align: left; padding: 12px 14px; border-radius: 12px; cursor: pointer;
  background: var(--po-surface); border: 1px solid var(--po-border); color: var(--po-text); font: inherit; }
.rp-kind:hover { border-color: var(--po-border-strong, var(--po-text-3)); }
.rp-kind[aria-checked="true"] { border-color: var(--po-brand-ink); box-shadow: 0 0 0 1px var(--po-brand-ink); }
.rp-kind strong { display: block; font-size: 14px; }
.rp-kind small { display: block; font-size: 12px; color: var(--po-text-3); line-height: 1.45; margin-top: 2px; }
.rp-kind-icon { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; flex-shrink: 0;
  background: var(--po-brand-soft); color: var(--po-brand-ink); }
.rp-controls { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 16px; }
.rp-check { display: inline-flex; gap: 8px; align-items: center; font-size: 14px; color: var(--po-text); height: 40px; }

.rp-scroll { overflow-x: auto; padding-bottom: 32px; }
.rp-sheet { width: 210mm; max-width: none; margin: 0 auto; background: #fff; color: #111; padding: 14mm 14mm 16mm;
  box-shadow: 0 8px 30px rgba(0,0,0,.10); border: 1px solid #e5e7eb; font: 12px/1.45 Arial, Helvetica, sans-serif; box-sizing: border-box; }
.rp-sheet.rp-wide { width: 297mm; }
.rp-head { display: flex; gap: 12px; align-items: center; padding-bottom: 8px; border-bottom: 2px solid #111; }
.rp-hospital { font-size: 16px; font-weight: 800; letter-spacing: .02em; }
.rp-sub { font-size: 11.5px; color: #444; }
.rp-meta { text-align: right; font-size: 10.5px; color: #555; }
.rp-title { margin: 12px 0 2px; font-size: 19px; font-weight: 800; color: #111; letter-spacing: 0; }
.rp-period { font-size: 12.5px; color: #333; margin-bottom: 12px; }
.rp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 14px; }
.rp-stat { border: 1px solid #cfd4d2; border-radius: 6px; padding: 7px 9px; break-inside: avoid; }
.rp-stat span { display: block; font-size: 10.5px; color: #555; text-transform: uppercase; letter-spacing: .05em; }
.rp-stat strong { display: block; font-size: 15px; margin-top: 2px; }
.rp-stat small { display: block; font-size: 10px; color: #777; }
.rp-section { margin-top: 14px; }
.rp-section h2 { font-size: 13px; font-weight: 800; margin: 0 0 6px; color: #111; break-after: avoid; }
.rp-table { display: table !important; width: 100% !important; overflow: visible !important; border-collapse: collapse; font-size: 11px; }
.rp-table th { text-align: left; font-weight: 700; background: #eef1ef; border-bottom: 1.5px solid #111; padding: 5px 6px; }
.rp-table td { padding: 4px 6px; border-bottom: 1px solid #e1e5e3; vertical-align: top; }
.rp-table .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.rp-table tfoot td { font-weight: 800; border-top: 1.5px solid #111; border-bottom: 0; }
.rp-table thead { display: table-header-group; }
.rp-table tr { break-inside: avoid; }
.rp-empty { margin: 0; font-size: 11.5px; color: #666; font-style: italic; }
.rp-sign { display: flex; gap: 14mm; margin-top: 22mm; break-inside: avoid; }
.rp-sign div { flex: 1; font-size: 11.5px; font-weight: 700; }
.rp-sign span { display: block; border-top: 1px solid #111; margin-bottom: 3px; }
.rp-sign small { display: block; font-weight: 400; font-size: 10px; color: #666; }

@media print {
  html, body, .po-root { background: #fff !important; }
  .po-sidebar, .po-topbar, .rp-noprint { display: none !important; }
  .po-shell, .po-main, .po-scroll { display: block !important; height: auto !important; overflow: visible !important; }
  .po-page { padding: 0 !important; max-width: none !important; }
  .rp-scroll { overflow: visible; padding: 0; }
  .rp-sheet, .rp-sheet.rp-wide { width: auto; box-shadow: none; border: 0; padding: 0; margin: 0; }
  .rp-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
