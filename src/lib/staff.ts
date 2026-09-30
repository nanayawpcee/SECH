/**
 * Employee management: shapes, labels, helpers and GraphQL documents
 * (plugin 1.7.0+). Safe to import from the browser — no data fetching here.
 */

export interface Unit {
  id: string;
  name: string;
  inchargeId: number;
  deputyId: number;
}

export interface Department {
  id: string;
  name: string;
  inchargeId: number;
  units: Unit[];
}

export interface Rank {
  id: string;
  name: string;
  /** Pay level, e.g. on the Single Spine Salary Structure. Free text. */
  level: string;
}

export interface Cadre {
  id: string;
  name: string;
  ranks: Rank[];
}

export interface Position {
  id: string;
  name: string;
}

export interface StaffStructure {
  departments: Department[];
}

export interface StaffRanks {
  cadres: Cadre[];
  positions: Position[];
}

export interface StaffSetup {
  structure: StaffStructure;
  ranks: StaffRanks;
}

export type EmploymentType =
  | "permanent" | "contract" | "national_service" | "rotation" | "internship" | "locum" | "volunteer";
export type EmployeeStatus = "active" | "on_leave" | "study_leave" | "seconded" | "exited";

export interface Employee {
  databaseId: number;
  title: string | null;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  gender: string | null;
  staffNumber: string | null;
  cadreId: string | null;
  rankId: string | null;
  positionId: string | null;
  departmentId: string | null;
  unitId: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  phone: string | null;
  email: string | null;
  dateFirstAppointment: string | null;
  dateCurrentRank: string | null;
  licenceBody: string | null;
  licencePin: string | null;
  licenceExpiry: string | null;
  cagdStaffId: string | null;
  ssnit: string | null;
  notes: string | null;
  userId: number | null;
  updatedAt: string;
}

export interface PortalUserOption {
  databaseId: number;
  name: string;
  email: string;
}

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string; temporary: boolean }[] = [
  { value: "permanent", label: "Permanent", temporary: false },
  { value: "contract", label: "Contract", temporary: false },
  { value: "national_service", label: "National service", temporary: true },
  { value: "rotation", label: "Rotation", temporary: true },
  { value: "internship", label: "Internship / housemanship", temporary: true },
  { value: "locum", label: "Locum", temporary: true },
  { value: "volunteer", label: "Volunteer", temporary: true },
];

export const STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "study_leave", label: "Study leave" },
  { value: "seconded", label: "Seconded" },
  { value: "exited", label: "Left the hospital" },
];

export const TITLES = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof.", "Rev.", "Rev. Sr.", "Rev. Fr.", "Very Rev."];

/** Professional regulators in Ghana, for the licence field. */
export const LICENCE_BODIES = [
  "Nursing and Midwifery Council (NMC)",
  "Medical and Dental Council (MDC)",
  "Pharmacy Council",
  "Allied Health Professions Council (AHPC)",
  "Other",
];

export const employmentLabel = (v: string | null | undefined) =>
  EMPLOYMENT_TYPES.find((t) => t.value === v)?.label ?? "Permanent";
export const statusLabel = (v: string | null | undefined) => STATUSES.find((s) => s.value === v)?.label ?? "Active";
export const isTemporary = (v: string | null | undefined) => !!EMPLOYMENT_TYPES.find((t) => t.value === v)?.temporary;

export const fullName = (e: Pick<Employee, "title" | "firstName" | "lastName" | "otherNames">, withTitle = false) =>
  [withTitle ? e.title : null, e.firstName, e.otherNames, e.lastName].filter(Boolean).join(" ");

/** Look-ups built once per render from the setup lists. */
export function indexSetup(setup: StaffSetup | null) {
  const departments = new Map<string, Department>();
  const units = new Map<string, Unit & { departmentId: string }>();
  const cadres = new Map<string, Cadre>();
  const ranks = new Map<string, Rank & { cadreId: string; order: number }>();
  const positions = new Map<string, Position>();
  for (const d of setup?.structure.departments ?? []) {
    departments.set(d.id, d);
    for (const u of d.units) units.set(u.id, { ...u, departmentId: d.id });
  }
  for (const c of setup?.ranks.cadres ?? []) {
    cadres.set(c.id, c);
    c.ranks.forEach((r, i) => ranks.set(r.id, { ...r, cadreId: c.id, order: i }));
  }
  for (const p of setup?.ranks.positions ?? []) positions.set(p.id, p);
  return { departments, units, cadres, ranks, positions };
}

/** Whole years between a YYYY-MM-DD date and today, or null. */
export function yearsSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) years--;
  return Math.max(0, years);
}

/** "expired", "soon" (within 60 days), "ok", or null when there's no expiry date. */
export function licenceState(expiry: string | null | undefined): "expired" | "soon" | "ok" | null {
  if (!expiry) return null;
  const end = new Date(`${expiry}T23:59:59`).getTime();
  if (Number.isNaN(end)) return null;
  const days = (end - Date.now()) / 86_400_000;
  return days < 0 ? "expired" : days <= 60 ? "soon" : "ok";
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Fields the portal sends when saving; the plugin validates them all again. */
export const EMPLOYEE_INPUT_FIELDS = [
  "title", "firstName", "lastName", "otherNames", "gender", "staffNumber",
  "cadreId", "rankId", "positionId", "departmentId", "unitId",
  "employmentType", "status", "phone", "email",
  "dateFirstAppointment", "dateCurrentRank",
  "licenceBody", "licencePin", "licenceExpiry",
  "cagdStaffId", "ssnit", "notes",
] as const;

const EMPLOYEE_FIELDS = `databaseId userId updatedAt ${EMPLOYEE_INPUT_FIELDS.join(" ")}`;

export const STAFF_QUERY = `
  query StaffData {
    staffSetup
    employees { ${EMPLOYEE_FIELDS} }
    staffPortalUsers { databaseId name email }
  }
`;

export const SAVE_EMPLOYEE = `
  mutation SaveEmployee($databaseId: Int, $userId: Int, ${EMPLOYEE_INPUT_FIELDS.map((f) => `$${f}: String`).join(", ")}) {
    saveEmployee(input: { databaseId: $databaseId, userId: $userId, ${EMPLOYEE_INPUT_FIELDS.map((f) => `${f}: $${f}`).join(", ")} }) {
      employee { ${EMPLOYEE_FIELDS} }
    }
  }
`;

export const DELETE_EMPLOYEE = `mutation DeleteEmployee($id: Int!) { deleteEmployee(input: { id: $id }) { ok } }`;
export const SAVE_STRUCTURE = `mutation SaveStaffStructure($json: String!) { saveStaffStructure(input: { json: $json }) { json } }`;
export const SAVE_RANKS = `mutation SaveStaffRanks($json: String!) { saveStaffRanks(input: { json: $json }) { json } }`;

export function isMissingStaffPlugin(message: string) {
  return /staffSetup|employees|staffPortalUsers|saveEmployee|deleteEmployee|saveStaffStructure|saveStaffRanks/i.test(message)
    && /Cannot query field|Unknown|not exist/i.test(message);
}

/** Only the fields the plugin accepts, as strings; it validates everything again. */
export function employeeVariables(body: Record<string, unknown>) {
  const vars: Record<string, unknown> = {};
  for (const f of EMPLOYEE_INPUT_FIELDS) {
    if (f in body) vars[f] = body[f] == null ? "" : String(body[f]);
  }
  if ("userId" in body) vars.userId = Number(body.userId) || 0;
  return vars;
}
