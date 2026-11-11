export type Direction = "in" | "out";

export interface AccTransaction {
  databaseId: number;
  receiptNo: string;
  direction: Direction;
  category: string;
  party: string;
  phone: string | null;
  amount: number;
  method: string;
  description: string | null;
  details: string;
  advanceId: number | null;
  tenancyId: number | null;
  status: "valid" | "voided";
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
  cashier: string;
  printCount: number;
  createdAt: string;
}

export interface AccAdvance {
  databaseId: number;
  staffName: string;
  employeeId: number | null;
  amount: number;
  repaid: number;
  outstanding: number;
  monthlyDeduction: number;
  purpose: string | null;
  dateGiven: string;
  status: "outstanding" | "cleared" | "voided";
}

export interface AccTenancy {
  databaseId: number;
  tenantName: string;
  employeeId: number | null;
  housingTypeId: string;
  unit: string | null;
  monthlyRate: number;
  startMonth: string;
  endMonth: string | null;
  monthsDue: number;
  totalDue: number;
  paid: number;
  balance: number;
  status: "active" | "ended";
}

export interface AccHousingType {
  id: string;
  name: string;
  monthlyRate: number;
}

export interface AccStaffOption {
  id: number;
  name: string;
  staffNumber: string | null;
}

export interface AccAuditEntry {
  id: number;
  at: string;
  userName: string;
  action: string;
  ref: string;
  detail: string;
}

export type DetailField =
  | { key: string; label: string; kind: "text" | "number" | "date"; required?: boolean; placeholder?: string }
  | { key: string; label: string; kind: "select"; options: string[]; required?: boolean }
  | { key: string; label: string; kind: "checks"; options: string[]; required?: boolean };

export interface Category {
  key: string;
  label: string;
  direction: Direction;
  link?: "advance" | "tenancy";
  fields: DetailField[];
  /** label for the payer or payee box */
  partyLabel?: string;
}

// keep in step with sech_acc_categories() in the plugin
export const CATEGORIES: Category[] = [
  { key: "mortuary", label: "Mortuary", direction: "in", fields: [
    { key: "deceased", label: "Name of the deceased", kind: "text", required: true },
    { key: "days", label: "Days in the mortuary", kind: "number" },
  ] },
  { key: "referral_investigation", label: "Investigations for referral cases", direction: "in", partyLabel: "Patient", fields: [
    { key: "tests", label: "Investigations", kind: "checks", options: ["ECG", "X-ray", "Laboratory", "Wellness", "Ultrasound"], required: true },
    { key: "referredFrom", label: "Referred from", kind: "text" },
  ] },
  { key: "opd_card", label: "OPD card", direction: "in", partyLabel: "Patient", fields: [
    { key: "folderNo", label: "Folder number", kind: "text" },
  ] },
  { key: "puva", label: "PUVA (phototherapy)", direction: "in", partyLabel: "Patient", fields: [
    { key: "sessions", label: "Number of sessions", kind: "number" },
  ] },
  { key: "spectacles", label: "Spectacles", direction: "in", partyLabel: "Patient", fields: [] },
  { key: "corporate_topup", label: "Corporate client top-up", direction: "in", partyLabel: "Patient", fields: [
    { key: "company", label: "Company", kind: "text", required: true },
    { key: "package", label: "Insurance package", kind: "text" },
    { key: "service", label: "Service above the package", kind: "text" },
  ] },
  { key: "cervical_screening", label: "Cervical cancer screening", direction: "in", partyLabel: "Client", fields: [] },
  { key: "rent", label: "Staff rent", direction: "in", link: "tenancy", partyLabel: "Tenant", fields: [
    { key: "period", label: "Months paid for", kind: "text", placeholder: "e.g. November 2026" },
  ] },
  { key: "anaesthetic_assessment", label: "Anaesthetic assessment (theatre bulk)", direction: "in", partyLabel: "Paid in by", fields: [
    { key: "patients", label: "Number of patients", kind: "number" },
    { key: "period", label: "Period covered", kind: "text", placeholder: "e.g. 1 to 15 November" },
  ] },
  { key: "imprest_refund", label: "Refund from staff imprest", direction: "in", partyLabel: "Staff member", fields: [
    { key: "errand", label: "Errand or imprest reference", kind: "text", required: true },
  ] },
  { key: "advance_repayment", label: "Salary advance repayment", direction: "in", link: "advance", partyLabel: "Staff member", fields: [] },
  { key: "mass_offering", label: "Mass offerings (OPD)", direction: "in", fields: [
    { key: "intention", label: "Mass intention", kind: "text" },
  ] },
  { key: "private_ward_topup", label: "Private ward top-up", direction: "in", fields: [
    { key: "patient", label: "Patient", kind: "text", required: true },
    { key: "folderNo", label: "Folder or admission number", kind: "text" },
    { key: "days", label: "Days in the private ward", kind: "number" },
  ] },
  { key: "conference_hall", label: "Conference hall rent", direction: "in", partyLabel: "Organisation", fields: [
    { key: "eventDate", label: "Date of use", kind: "date" },
    { key: "event", label: "Event", kind: "text" },
  ] },
  { key: "department_bulk", label: "Department bulk purchase (Macintosh, test kits)", direction: "in", partyLabel: "Paid in by", fields: [
    { key: "department", label: "Department", kind: "select", options: ["Maternity", "Laboratory", "Theatre", "Other"], required: true },
    { key: "requisitionNo", label: "Stores requisition number", kind: "text" },
    { key: "items", label: "Items", kind: "text", placeholder: "e.g. Macintosh, pregnancy test kits" },
  ] },
  { key: "supplier_registration", label: "Supplier company registration", direction: "in", partyLabel: "Company", fields: [] },
  { key: "other_in", label: "Other collection", direction: "in", fields: [] },
  { key: "client_refund", label: "Refund to client", direction: "out", partyLabel: "Paid to", fields: [
    { key: "folderNo", label: "Folder or admission number", kind: "text" },
    { key: "reason", label: "Reason for the refund", kind: "text", required: true },
  ] },
  { key: "salary_advance", label: "Salary advance", direction: "out", link: "advance", partyLabel: "Staff member", fields: [] },
  { key: "other_out", label: "Other payment", direction: "out", partyLabel: "Paid to", fields: [] },
];

export const categoryOf = (key: string) => CATEGORIES.find((c) => c.key === key);
export const categoryLabel = (key: string) => categoryOf(key)?.label ?? key;

/** "1,250.00" from pesewas */
export function formatMoney(pesewas: number, withCurrency = true) {
  const s = (pesewas / 100).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return withCurrency ? `GHS ${s}` : s;
}

/** "1,250.5" typed by a person -> 125050 pesewas, or null if it isn't a sensible amount */
export function parseMoney(input: string): number | null {
  const clean = input.replace(/[,\s]/g, "").replace(/^GHS/i, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const pesewas = Math.round(Number(clean) * 100);
  return pesewas > 0 ? pesewas : null;
}

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function underThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} hundred`);
  if (rest) {
    const words = rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES[rest % 10]}` : ""}`;
    parts.push(h ? `and ${words}` : words);
  }
  return parts.join(" ");
}

function wholeNumber(n: number): string {
  if (n === 0) return "zero";
  const scales: [number, string][] = [[1_000_000_000, "billion"], [1_000_000, "million"], [1_000, "thousand"]];
  const parts: string[] = [];
  let rest = n;
  for (const [size, name] of scales) {
    if (rest >= size) {
      parts.push(`${underThousand(Math.floor(rest / size))} ${name}`);
      rest %= size;
    }
  }
  if (rest) parts.push(rest < 100 && parts.length ? `and ${underThousand(rest)}` : underThousand(rest));
  return parts.join(" ");
}

/** "Two hundred and fifty Ghana cedis, fifty pesewas" for the receipt */
export function amountInWords(pesewas: number) {
  const cedis = Math.floor(pesewas / 100);
  const p = pesewas % 100;
  let s = cedis ? `${wholeNumber(cedis)} Ghana cedi${cedis === 1 ? "" : "s"}` : "";
  if (p) s += `${s ? ", " : ""}${wholeNumber(p)} pesewa${p === 1 ? "" : "s"}`;
  s = s || "zero Ghana cedis";
  return s.charAt(0).toUpperCase() + s.slice(1) + " only";
}

export function parseDetails(json: string): Record<string, string> {
  try {
    const v = JSON.parse(json || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** detail values with their labels, in the category's order */
export function detailRows(t: Pick<AccTransaction, "category" | "details">): [string, string][] {
  const values = parseDetails(t.details);
  const cat = categoryOf(t.category);
  const rows: [string, string][] = [];
  for (const f of cat?.fields ?? []) if (values[f.key]) rows.push([f.label, values[f.key]]);
  return rows;
}

export function monthLabel(ym: string | null | undefined) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

const TXN_FIELDS = `databaseId receiptNo direction category party phone amount method description details
  advanceId tenancyId status voidReason voidedBy voidedAt cashier printCount createdAt`;
const ADV_FIELDS = "databaseId staffName employeeId amount repaid outstanding monthlyDeduction purpose dateGiven status";
const TEN_FIELDS = "databaseId tenantName employeeId housingTypeId unit monthlyRate startMonth endMonth monthsDue totalDue paid balance status";

export const ACC_OVERVIEW_QUERY = `query AccOverview($from: String, $to: String) {
  accTransactions(from: $from, to: $to) { ${TXN_FIELDS} }
  accAdvances { ${ADV_FIELDS} }
  accTenancies { ${TEN_FIELDS} }
  accHousingTypes { id name monthlyRate }
  accStaffOptions { id name staffNumber }
}`;

export const ACC_TXN_QUERY = `query AccTxn($id: Int!) { accTransaction(id: $id) { ${TXN_FIELDS} } }`;

export const ACC_RECORD = `mutation AccRecord($category: String!, $party: String!, $amount: Int!, $phone: String, $description: String,
  $details: String, $advanceId: Int, $tenancyId: Int, $employeeId: Int, $monthlyDeduction: Int, $purpose: String) {
  accRecordTransaction(input: { category: $category, party: $party, amount: $amount, phone: $phone, description: $description,
    details: $details, advanceId: $advanceId, tenancyId: $tenancyId, employeeId: $employeeId,
    monthlyDeduction: $monthlyDeduction, purpose: $purpose }) { transaction { ${TXN_FIELDS} } }
}`;

export const ACC_VOID = `mutation AccVoid($id: Int!, $reason: String!) { accVoidTransaction(input: { id: $id, reason: $reason }) { transaction { ${TXN_FIELDS} } } }`;
export const ACC_LOG_PRINT = `mutation AccPrint($id: Int!) { accLogPrint(input: { id: $id }) { printCount } }`;

export const ACC_SAVE_TENANCY = `mutation AccTenancy($id: Int, $tenantName: String!, $employeeId: Int, $housingTypeId: String!, $unit: String,
  $monthlyRate: Int!, $startMonth: String!, $endMonth: String) {
  accSaveTenancy(input: { id: $id, tenantName: $tenantName, employeeId: $employeeId, housingTypeId: $housingTypeId, unit: $unit,
    monthlyRate: $monthlyRate, startMonth: $startMonth, endMonth: $endMonth }) { tenancy { ${TEN_FIELDS} } }
}`;

export const ACC_SAVE_HOUSING = `mutation AccHousing($json: String!) { accSaveHousingTypes(input: { json: $json }) { types { id name monthlyRate } } }`;
export const ACC_LOG_EXPORT = `mutation AccExport($count: Int!, $range: String) { accLogExport(input: { count: $count, range: $range }) { ok } }`;
export const ACC_AUDIT_QUERY = `query AccAudit($first: Int) { accAudit(first: $first) { id at userName action ref detail } }`;

export const ACC_AUDIT_ACTIONS: Record<string, string> = {
  viewed: "Opened transactions",
  recorded: "Recorded",
  voided: "Voided",
  printed: "Printed receipt",
  reprinted: "Reprinted receipt",
  tenancy_added: "Added tenancy",
  tenancy_changed: "Changed tenancy",
  housing_types: "Changed housing types",
  exported: "Exported",
};

export function isMissingAccountsPlugin(message: string) {
  return /accTransactions|accAdvances|accTenancies|accHousingTypes|accStaffOptions|accRecordTransaction|accTransaction|accAudit/.test(message)
    && /Cannot query field|Unknown|not exist|not defined/i.test(message);
}
