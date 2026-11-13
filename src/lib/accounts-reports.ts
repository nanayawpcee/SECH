// Accounts office reports. Each report is described once, as plain sections,
// and both the printed page and the Excel download are drawn from that.
// Money is in pesewas throughout, like the rest of the accounts code.

import {
  categoryLabel, CATEGORIES, maskGhanaCard, monthLabel,
  type AccAdvance, type AccHousingType, type AccTenancy, type AccTransaction,
} from "@/lib/accounts";
import type { XRow, XSheet, XStyle } from "@/lib/xlsx";

export type ReportKind = "daily" | "period" | "advances" | "rent";

export const REPORT_KINDS: { id: ReportKind; label: string; hint: string }[] = [
  { id: "daily", label: "Daily cash report", hint: "One day's collections and payments, for close of day" },
  { id: "period", label: "Period summary", hint: "Totals by category, cashier and day for any dates" },
  { id: "advances", label: "Salary advances", hint: "What each staff member was given, has repaid and still owes" },
  { id: "rent", label: "Staff rent", hint: "Each tenancy's rent due, paid, arrears and months ahead" },
];

export type ColKind = "text" | "money" | "count";
export interface Col { label: string; kind?: ColKind; width?: number }
export type Cell = string | number | null;

export type Section =
  | { type: "stats"; items: { label: string; value: number; kind: "money" | "count"; note?: string }[] }
  | { type: "table"; title: string; sheet?: string; cols: Col[]; rows: Cell[][]; total?: Cell[]; empty?: string };

export interface Report {
  kind: ReportKind;
  title: string;
  /** the dates or "as at" line */
  period: string;
  sections: Section[];
  /** sign-off lines at the foot of the printed report */
  signOff?: string[];
  /** rows in the main list, for the export log */
  count: number;
  fileName: string;
}

const day = (iso: string) => iso.slice(0, 10);
const longDate = (ymd: string) =>
  new Date(`${ymd}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = (ymd: string) =>
  new Date(`${ymd}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function sumBy<T>(items: T[], key: (t: T) => string, amount: (t: T) => number) {
  const m = new Map<string, { count: number; total: number }>();
  for (const t of items) {
    const k = key(t);
    const row = m.get(k) ?? { count: 0, total: 0 };
    row.count++;
    row.total += amount(t);
    m.set(k, row);
  }
  return m;
}

/** category rows in the order the categories are listed, then anything unknown */
function byCategory(txns: AccTransaction[], direction: "in" | "out") {
  const m = sumBy(txns.filter((t) => t.direction === direction), (t) => t.category, (t) => t.amount);
  const order = CATEGORIES.filter((c) => c.direction === direction).map((c) => c.key);
  const keys = [...order.filter((k) => m.has(k)), ...Array.from(m.keys()).filter((k) => !order.includes(k))];
  const rows: Cell[][] = keys.map((k) => [categoryLabel(k), m.get(k)!.count, m.get(k)!.total]);
  const count = keys.reduce((n, k) => n + m.get(k)!.count, 0);
  const total = keys.reduce((n, k) => n + m.get(k)!.total, 0);
  return { rows, total: ["Total", count, total] as Cell[] };
}

function byCashier(txns: AccTransaction[]) {
  const m = new Map<string, { rc: number; inn: number; pv: number; out: number }>();
  for (const t of txns) {
    const r = m.get(t.cashier || "Unknown") ?? { rc: 0, inn: 0, pv: 0, out: 0 };
    if (t.direction === "in") { r.rc++; r.inn += t.amount; } else { r.pv++; r.out += t.amount; }
    m.set(t.cashier || "Unknown", r);
  }
  const rows: Cell[][] = Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, r]) => [name, r.rc, r.inn, r.pv, r.out, r.inn - r.out]);
  return rows;
}

function cashStats(valid: AccTransaction[], voided: AccTransaction[]) {
  const inn = valid.filter((t) => t.direction === "in");
  const out = valid.filter((t) => t.direction === "out");
  const collected = inn.reduce((s, t) => s + t.amount, 0);
  const paid = out.reduce((s, t) => s + t.amount, 0);
  return {
    collected, paid,
    section: {
      type: "stats" as const,
      items: [
        { label: "Collected", value: collected, kind: "money" as const },
        { label: "Paid out", value: paid, kind: "money" as const },
        { label: "Net cash", value: collected - paid, kind: "money" as const, note: "Collected less paid out" },
        { label: "Receipts", value: inn.length, kind: "count" as const },
        { label: "Payment vouchers", value: out.length, kind: "count" as const },
        { label: "Voided", value: voided.length, kind: "count" as const, note: "Not in the totals" },
      ],
    },
  };
}

const CATEGORY_COLS: Col[] = [{ label: "Category", width: 44 }, { label: "Count", kind: "count", width: 9 }, { label: "Amount (GHS)", kind: "money", width: 16 }];
const CASHIER_COLS: Col[] = [
  { label: "Cashier", width: 28 }, { label: "Receipts", kind: "count", width: 10 }, { label: "Collected (GHS)", kind: "money", width: 16 },
  { label: "Vouchers", kind: "count", width: 10 }, { label: "Paid out (GHS)", kind: "money", width: 16 }, { label: "Net (GHS)", kind: "money", width: 16 },
];

function voidedTable(voided: AccTransaction[]): Section {
  return {
    type: "table", title: "Voided receipts and vouchers", sheet: "Voided",
    cols: [
      { label: "No.", width: 18 }, { label: "Category", width: 30 }, { label: "Amount (GHS)", kind: "money", width: 14 },
      { label: "Reason", width: 36 }, { label: "Voided by", width: 22 },
    ],
    rows: voided.map((t) => [t.receiptNo, categoryLabel(t.category), t.amount, t.voidReason ?? "", t.voidedBy ?? ""]),
    empty: "None voided.",
  };
}

/* ── Daily cash report ─────────────────────────────────────── */

export function dailyReport(all: AccTransaction[], date: string): Report {
  const txns = all.filter((t) => day(t.createdAt) === date).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const valid = txns.filter((t) => t.status !== "voided");
  const voided = txns.filter((t) => t.status === "voided");
  const stats = cashStats(valid, voided);
  const inn = byCategory(valid, "in");
  const out = byCategory(valid, "out");

  return {
    kind: "daily",
    title: "Daily cash report",
    period: longDate(date),
    count: txns.length,
    fileName: `sech-daily-cash-${date}`,
    signOff: ["Cashier", "Accountant", "Date received"],
    sections: [
      stats.section,
      { type: "table", title: "Money in by category", sheet: "Money in", cols: CATEGORY_COLS, rows: inn.rows, total: inn.total, empty: "Nothing collected." },
      { type: "table", title: "Money out by category", sheet: "Money out", cols: CATEGORY_COLS, rows: out.rows, total: out.total, empty: "Nothing paid out." },
      { type: "table", title: "By cashier", sheet: "By cashier", cols: CASHIER_COLS, rows: byCashier(valid), empty: "No cashier activity." },
      {
        type: "table", title: "Receipts and vouchers", sheet: "Receipts and vouchers",
        cols: [
          { label: "Time", width: 8 }, { label: "No.", width: 17 }, { label: "Hospital PV", width: 16 }, { label: "Category", width: 30 },
          { label: "Received from / paid to", width: 28 }, { label: "In (GHS)", kind: "money", width: 13 },
          { label: "Out (GHS)", kind: "money", width: 13 }, { label: "Cashier", width: 22 },
        ],
        rows: valid.map((t) => [
          time(t.createdAt), t.receiptNo, t.manualRef ?? "", categoryLabel(t.category), t.party,
          t.direction === "in" ? t.amount : null, t.direction === "out" ? t.amount : null, t.cashier,
        ]),
        total: ["Total", null, null, null, null, stats.collected, stats.paid, null],
        empty: "No receipts or vouchers on this day.",
      },
      voidedTable(voided),
    ],
  };
}

/* ── Period summary ────────────────────────────────────────── */

export function periodReport(all: AccTransaction[], from: string, to: string): Report {
  const txns = all.filter((t) => day(t.createdAt) >= from && day(t.createdAt) <= to);
  const valid = txns.filter((t) => t.status !== "voided");
  const voided = txns.filter((t) => t.status === "voided");
  const stats = cashStats(valid, voided);
  const inn = byCategory(valid, "in");
  const out = byCategory(valid, "out");

  const days = new Map<string, { rc: number; inn: number; pv: number; out: number }>();
  for (const t of valid) {
    const r = days.get(day(t.createdAt)) ?? { rc: 0, inn: 0, pv: 0, out: 0 };
    if (t.direction === "in") { r.rc++; r.inn += t.amount; } else { r.pv++; r.out += t.amount; }
    days.set(day(t.createdAt), r);
  }
  const dayRows: Cell[][] = Array.from(days.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([d, r]) => [shortDate(d), r.rc, r.inn, r.pv, r.out, r.inn - r.out]);

  return {
    kind: "period",
    title: "Period summary",
    period: from === to ? longDate(from) : `${shortDate(from)} to ${shortDate(to)}`,
    count: txns.length,
    fileName: `sech-accounts-summary-${from}-to-${to}`,
    signOff: ["Prepared by", "Checked by"],
    sections: [
      stats.section,
      { type: "table", title: "Money in by category", sheet: "Money in", cols: CATEGORY_COLS, rows: inn.rows, total: inn.total, empty: "Nothing collected." },
      { type: "table", title: "Money out by category", sheet: "Money out", cols: CATEGORY_COLS, rows: out.rows, total: out.total, empty: "Nothing paid out." },
      { type: "table", title: "By cashier", sheet: "By cashier", cols: CASHIER_COLS, rows: byCashier(valid), empty: "No cashier activity." },
      {
        type: "table", title: "Day by day", sheet: "Day by day",
        cols: [
          { label: "Date", width: 14 }, { label: "Receipts", kind: "count", width: 10 }, { label: "Collected (GHS)", kind: "money", width: 16 },
          { label: "Vouchers", kind: "count", width: 10 }, { label: "Paid out (GHS)", kind: "money", width: 16 }, { label: "Net (GHS)", kind: "money", width: 16 },
        ],
        rows: dayRows,
        total: ["Total", inn.total[1], stats.collected, out.total[1], stats.paid, stats.collected - stats.paid],
        empty: "No receipts or vouchers in this period.",
      },
      voidedTable(voided),
    ],
  };
}

/* ── Salary advances ───────────────────────────────────────── */

export function advancesReport(advances: AccAdvance[], outstandingOnly: boolean, asAt: string): Report {
  const list = advances
    .filter((a) => a.status !== "voided" && (!outstandingOnly || a.status === "outstanding"))
    .sort((a, b) => (a.department ?? "").localeCompare(b.department ?? "") || a.staffName.localeCompare(b.staffName));
  const given = list.reduce((s, a) => s + a.amount, 0);
  const repaid = list.reduce((s, a) => s + a.repaid, 0);
  const owed = list.reduce((s, a) => s + a.outstanding, 0);

  const depts = new Map<string, { n: number; given: number; repaid: number; owed: number }>();
  for (const a of list) {
    const k = a.department || "Not recorded";
    const r = depts.get(k) ?? { n: 0, given: 0, repaid: 0, owed: 0 };
    r.n++; r.given += a.amount; r.repaid += a.repaid; r.owed += a.outstanding;
    depts.set(k, r);
  }

  return {
    kind: "advances",
    title: outstandingOnly ? "Salary advances still owed" : "Salary advances",
    period: `As at ${longDate(asAt)}`,
    count: list.length,
    fileName: `sech-salary-advances-${asAt}`,
    signOff: ["Prepared by", "Checked by"],
    sections: [
      {
        type: "stats",
        items: [
          { label: "Advances", value: list.length, kind: "count" },
          { label: "Given", value: given, kind: "money" },
          { label: "Repaid", value: repaid, kind: "money" },
          { label: "Still owed", value: owed, kind: "money" },
        ],
      },
      {
        type: "table", title: "By department or unit", sheet: "By department",
        cols: [
          { label: "Department or unit", width: 40 }, { label: "Advances", kind: "count", width: 10 },
          { label: "Given (GHS)", kind: "money", width: 15 }, { label: "Repaid (GHS)", kind: "money", width: 15 }, { label: "Owed (GHS)", kind: "money", width: 15 },
        ],
        rows: Array.from(depts.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([d, r]) => [d, r.n, r.given, r.repaid, r.owed]),
        total: ["Total", list.length, given, repaid, owed],
        empty: "No advances.",
      },
      {
        type: "table", title: "Advances", sheet: "Advances",
        cols: [
          { label: "Staff member", width: 26 }, { label: "Department or unit", width: 30 }, { label: "Ghana Card", width: 17 },
          { label: "Given on", width: 13 }, { label: "Amount (GHS)", kind: "money", width: 14 }, { label: "Repaid (GHS)", kind: "money", width: 14 },
          { label: "Owed (GHS)", kind: "money", width: 14 }, { label: "Monthly (GHS)", kind: "money", width: 14 }, { label: "Status", width: 12 },
        ],
        rows: list.map((a) => [
          a.staffName, a.department ?? "", maskGhanaCard(a.ghanaCard), shortDate(a.dateGiven), a.amount, a.repaid, a.outstanding,
          a.monthlyDeduction || null, a.status === "outstanding" ? "Owing" : "Cleared",
        ]),
        total: ["Total", null, null, null, given, repaid, owed, null, null],
        empty: outstandingOnly ? "Nobody owes on an advance." : "No advances.",
      },
    ],
  };
}

/* ── Staff rent ────────────────────────────────────────────── */

export function rentReport(tenancies: AccTenancy[], types: AccHousingType[], activeOnly: boolean, asAt: string): Report {
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const list = tenancies
    .filter((t) => !activeOnly || t.status === "active")
    .sort((a, b) => (typeName.get(a.housingTypeId) ?? "").localeCompare(typeName.get(b.housingTypeId) ?? "") || a.tenantName.localeCompare(b.tenantName));
  const arrears = list.reduce((s, t) => s + Math.max(0, t.balance), 0);
  const ahead = list.reduce((s, t) => s + Math.max(0, -t.balance), 0);
  const roll = list.filter((t) => t.status === "active").reduce((s, t) => s + t.monthlyRate, 0);
  const paid = list.reduce((s, t) => s + t.paid, 0);

  const byType = new Map<string, { n: number; roll: number; paid: number; arrears: number }>();
  for (const t of list) {
    const k = typeName.get(t.housingTypeId) ?? t.housingTypeId;
    const r = byType.get(k) ?? { n: 0, roll: 0, paid: 0, arrears: 0 };
    r.n++;
    if (t.status === "active") r.roll += t.monthlyRate;
    r.paid += t.paid;
    r.arrears += Math.max(0, t.balance);
    byType.set(k, r);
  }

  const standing = (t: AccTenancy) => {
    if (t.balance > 0) return "In arrears";
    if (t.balance < 0 && t.monthlyRate > 0) {
      const m = Math.floor(-t.balance / t.monthlyRate);
      return m >= 1 ? `${m} month${m === 1 ? "" : "s"} ahead` : "Part paid ahead";
    }
    return "Up to date";
  };

  return {
    kind: "rent",
    title: activeOnly ? "Staff rent" : "Staff rent, including ended tenancies",
    period: `As at ${longDate(asAt)}`,
    count: list.length,
    fileName: `sech-staff-rent-${asAt}`,
    signOff: ["Prepared by", "Checked by"],
    sections: [
      {
        type: "stats",
        items: [
          { label: "Tenancies", value: list.length, kind: "count" },
          { label: "Monthly rent roll", value: roll, kind: "money", note: "Active tenancies" },
          { label: "In arrears", value: list.filter((t) => t.balance > 0).length, kind: "count" },
          { label: "Arrears", value: arrears, kind: "money" },
          { label: "Paid ahead", value: ahead, kind: "money" },
          { label: "Rent received", value: paid, kind: "money", note: "Since each tenancy began" },
        ],
      },
      {
        type: "table", title: "By housing type", sheet: "By housing type",
        cols: [
          { label: "Housing type", width: 32 }, { label: "Tenancies", kind: "count", width: 10 }, { label: "Monthly roll (GHS)", kind: "money", width: 17 },
          { label: "Received (GHS)", kind: "money", width: 16 }, { label: "Arrears (GHS)", kind: "money", width: 15 },
        ],
        rows: Array.from(byType.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([k, r]) => [k, r.n, r.roll, r.paid, r.arrears]),
        total: ["Total", list.length, roll, paid, arrears],
        empty: "No tenancies.",
      },
      {
        type: "table", title: "Tenancies", sheet: "Tenancies",
        cols: [
          { label: "Tenant", width: 26 }, { label: "Department or unit", width: 28 }, { label: "Housing", width: 24 }, { label: "Unit", width: 10 },
          { label: "Monthly (GHS)", kind: "money", width: 13 }, { label: "Since", width: 10 }, { label: "Months due", kind: "count", width: 11 },
          { label: "Due (GHS)", kind: "money", width: 13 }, { label: "Paid (GHS)", kind: "money", width: 13 },
          { label: "Arrears (GHS)", kind: "money", width: 13 }, { label: "Ahead (GHS)", kind: "money", width: 13 }, { label: "Standing", width: 16 },
        ],
        rows: list.map((t) => [
          t.tenantName, t.department ?? "", typeName.get(t.housingTypeId) ?? t.housingTypeId, t.unit ?? "", t.monthlyRate,
          monthLabel(t.startMonth), t.monthsDue, t.totalDue, t.paid, t.balance > 0 ? t.balance : null, t.balance < 0 ? -t.balance : null,
          t.status === "ended" ? `Ended, ${standing(t).toLowerCase()}` : standing(t),
        ]),
        total: ["Total", null, null, null, null, null, null, list.reduce((s, t) => s + t.totalDue, 0), paid, arrears, ahead, null],
        empty: activeOnly ? "No active tenancies." : "No tenancies.",
      },
    ],
  };
}

/* ── Excel ─────────────────────────────────────────────────── */

export function reportSheets(r: Report, meta: { hospital: string; generatedBy: string; generatedAt: string }): XSheet[] {
  const head: XRow[] = [
    { cells: [meta.hospital], style: "title" },
    { cells: [r.title], style: "bold" },
    { cells: [r.period] },
    { cells: [`Generated ${meta.generatedAt} by ${meta.generatedBy}`], style: "muted" },
    { cells: [] },
  ];
  const money = (v: Cell) => (typeof v === "number" ? v / 100 : v);
  const cellStyle = (kind: ColKind | undefined, bold: boolean): XStyle =>
    kind === "money" ? (bold ? "moneyBold" : "money") : bold ? "bold" : "text";

  const summary: XRow[] = [...head];
  const sheets: XSheet[] = [];
  for (const s of r.sections) {
    if (s.type === "stats") {
      for (const it of s.items) {
        summary.push({ cells: [it.label, it.kind === "money" ? it.value / 100 : it.value, it.note ?? ""], style: ["bold", it.kind === "money" ? "money" : "text", "muted"] });
      }
      summary.push({ cells: [] });
      continue;
    }
    const table: XRow[] = [
      { cells: s.cols.map((c) => c.label), style: "bold" },
      ...s.rows.map((row) => ({ cells: row.map((v, i) => (s.cols[i]?.kind === "money" ? money(v) : v)), style: s.cols.map((c) => cellStyle(c.kind, false)) })),
      ...(s.total && s.rows.length ? [{ cells: s.total.map((v, i) => (s.cols[i]?.kind === "money" ? money(v) : v)), style: s.cols.map((c) => cellStyle(c.kind, true)) }] : []),
    ];
    if (!s.rows.length) table.push({ cells: [s.empty ?? "Nothing to show."], style: "muted" });
    sheets.push({ name: s.sheet ?? s.title, rows: [...head, { cells: [s.title], style: "bold" }, ...table], widths: s.cols.map((c) => c.width ?? 16) });
  }
  return [{ name: "Summary", rows: summary, widths: [26, 18, 28] }, ...sheets];
}
