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
  dateExited: string | null;
  anonymisedAt: string | null;
  userId: number | null;
  updatedAt: string;
  // biodata from HR's forms (plugin 1.23.0); lists are JSON text
  dateOfBirth: string | null;
  nationality: string | null;
  hometown: string | null;
  hometownDistrict: string | null;
  hometownRegion: string | null;
  ghanaCard: string | null;
  homeAddress: string | null;
  gpsAddress: string | null;
  residentialAddress: string | null;
  religion: string | null;
  maritalStatus: string | null;
  spouseName: string | null;
  fatherName: string | null;
  fatherAlive: string | null;
  fatherAddress: string | null;
  motherName: string | null;
  motherAlive: string | null;
  motherAddress: string | null;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinAddress: string | null;
  nextOfKinPhone: string | null;
  nextOfKinAltPhone: string | null;
  nextOfKinEmail: string | null;
  emergencyName: string | null;
  emergencyAddress: string | null;
  emergencyPhone: string | null;
  gmoneyAccount: string | null;
  gcbAccount: string | null;
  gcbBranch: string | null;
  dateEnding: string | null;
  workPattern: string | null;
  declarationDate: string | null;
  hrCertifiedBy: string | null;
  hrCertifiedDate: string | null;
  children: string | null;
  education: string | null;
  workHistory: string | null;
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

export function yearsSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) years--;
  return Math.max(0, years);
}

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

// the plugin validates all of these again
export const EMPLOYEE_INPUT_FIELDS = [
  "title", "firstName", "lastName", "otherNames", "gender", "staffNumber",
  "cadreId", "rankId", "positionId", "departmentId", "unitId",
  "employmentType", "status", "phone", "email",
  "dateFirstAppointment", "dateCurrentRank",
  "licenceBody", "licencePin", "licenceExpiry",
  "cagdStaffId", "ssnit", "notes", "dateExited",
  // biodata (plugin 1.23.0)
  "dateOfBirth", "nationality", "hometown", "hometownDistrict", "hometownRegion", "ghanaCard",
  "homeAddress", "gpsAddress", "residentialAddress", "religion", "maritalStatus", "spouseName",
  "fatherName", "fatherAlive", "fatherAddress", "motherName", "motherAlive", "motherAddress",
  "nextOfKinName", "nextOfKinRelationship", "nextOfKinAddress", "nextOfKinPhone", "nextOfKinAltPhone", "nextOfKinEmail",
  "emergencyName", "emergencyAddress", "emergencyPhone", "gmoneyAccount", "gcbAccount", "gcbBranch",
  "dateEnding", "workPattern", "declarationDate", "hrCertifiedBy", "hrCertifiedDate", "children",
  "education", "workHistory",
] as const;

/** Biodata fields, added in plugin 1.23.0 */
export const BIODATA_FIELDS = ["dateOfBirth", "nationality", "hometown", "hometownDistrict", "hometownRegion", "ghanaCard", "homeAddress", "gpsAddress", "residentialAddress", "religion", "maritalStatus", "spouseName", "fatherName", "fatherAlive", "fatherAddress", "motherName", "motherAlive", "motherAddress", "nextOfKinName", "nextOfKinRelationship", "nextOfKinAddress", "nextOfKinPhone", "nextOfKinAltPhone", "nextOfKinEmail", "emergencyName", "emergencyAddress", "emergencyPhone", "gmoneyAccount", "gcbAccount", "gcbBranch", "dateEnding", "workPattern", "declarationDate", "hrCertifiedBy", "hrCertifiedDate", "children", "education", "workHistory"] as const;

const EMPLOYEE_FIELDS = `databaseId userId updatedAt anonymisedAt ${EMPLOYEE_INPUT_FIELDS.join(" ")}`;

export const STAFF_QUERY = `
  query StaffData {
    staffSetup
    employees { ${EMPLOYEE_FIELDS} }
    staffPortalUsers { databaseId name email }
  }
`;

function saveEmployeeMutation(inputs: readonly string[], fields: string) {
  return `
  mutation SaveEmployee($databaseId: Int, $userId: Int, ${inputs.map((f) => `$${f}: String`).join(", ")}) {
    saveEmployee(input: { databaseId: $databaseId, userId: $userId, ${inputs.map((f) => `${f}: $${f}`).join(", ")} }) {
      employee { ${fields} }
    }
  }
`;
}

export const SAVE_EMPLOYEE = saveEmployeeMutation(EMPLOYEE_INPUT_FIELDS, EMPLOYEE_FIELDS);

const LEGACY_INPUT_FIELDS = EMPLOYEE_INPUT_FIELDS.filter((f) => f !== "dateExited" && !(BIODATA_FIELDS as readonly string[]).includes(f));
export const SAVE_EMPLOYEE_LEGACY = saveEmployeeMutation(
  LEGACY_INPUT_FIELDS,
  `databaseId userId updatedAt ${LEGACY_INPUT_FIELDS.join(" ")}`,
);

// tries the current mutation, then the pre-1.10.0 one
export async function saveEmployeeCompat<T>(
  run: (query: string, vars: Record<string, unknown>) => Promise<T>,
  vars: Record<string, unknown>,
  isOutdated: (error: unknown) => boolean,
): Promise<T> {
  try {
    return await run(SAVE_EMPLOYEE, vars);
  } catch (error) {
    if (!isOutdated(error)) throw error;
    const keep = new Set<string>(["databaseId", "userId", ...LEGACY_INPUT_FIELDS]);
    return run(SAVE_EMPLOYEE_LEGACY, Object.fromEntries(Object.entries(vars).filter(([k]) => keep.has(k))));
  }
}

// fallback while WordPress is on an older plugin (before 1.10.0 for dateExited, 1.23.0 for biodata)
export const STAFF_QUERY_LEGACY = STAFF_QUERY.replace(
  EMPLOYEE_FIELDS,
  EMPLOYEE_FIELDS.split(" ").filter((f) => f !== "anonymisedAt" && f !== "dateExited" && !(BIODATA_FIELDS as readonly string[]).includes(f)).join(" "),
);

export function isOutdatedStaffPlugin(message: string) {
  return /dateExited|anonymisedAt|staffDataProtection|staffAudit|myStaffRecord|logStaffExport|setStaffRetention|dateOfBirth|nationality|hometown|ghanaCard|nextOfKin|emergency|gmoneyAccount|gcbAccount|workHistory|children|education|declarationDate|hrCertified|workPattern|dateEnding/.test(message)
    && /Cannot query field|Unknown|not exist|not defined/i.test(message);
}

export interface StaffAuditEntry {
  id: number;
  at: string;
  userName: string;
  action: string;
  employeeId: number | null;
  employeeName: string;
  detail: string;
}

export interface StaffDataProtection {
  retentionYears: number;
  encryption: "dedicated" | "site" | "off";
  auditKeepYears: number;
  dueForCleanup: number;
}

export const STAFF_DP_QUERY = `query StaffDP { staffDataProtection { retentionYears encryption auditKeepYears dueForCleanup } }`;
export const STAFF_AUDIT_QUERY = `query StaffAudit($first: Int) { staffAudit(first: $first) { id at userName action employeeId employeeName detail } }`;
export const SET_STAFF_RETENTION = `mutation SetStaffRetention($years: Int!) { setStaffRetention(input: { years: $years }) { years } }`;
export const LOG_STAFF_EXPORT = `mutation LogStaffExport($count: Int!, $withIdentifiers: Boolean) { logStaffExport(input: { count: $count, withIdentifiers: $withIdentifiers }) { ok } }`;
/** plugin 1.23.0 and later: also records that biodata went into the file */
export const LOG_STAFF_EXPORT_BIODATA = `mutation LogStaffExport($count: Int!, $withIdentifiers: Boolean, $withBiodata: Boolean) { logStaffExport(input: { count: $count, withIdentifiers: $withIdentifiers, withBiodata: $withBiodata }) { ok } }`;

export interface MyStaffRecord {
  title: string | null;
  firstName: string | null;
  otherNames: string | null;
  lastName: string | null;
  gender: string | null;
  staffNumber: string | null;
  department: string | null;
  unit: string | null;
  cadre: string | null;
  rank: string | null;
  position: string | null;
  employmentType: string | null;
  status: string | null;
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
  updatedAt: string | null;
  // biodata, from plugin 1.23.0 (bank details stay with HR)
  dateOfBirth?: string | null;
  nationality?: string | null;
  hometown?: string | null;
  hometownDistrict?: string | null;
  hometownRegion?: string | null;
  ghanaCard?: string | null;
  homeAddress?: string | null;
  gpsAddress?: string | null;
  residentialAddress?: string | null;
  religion?: string | null;
  maritalStatus?: string | null;
  spouseName?: string | null;
  fatherName?: string | null;
  fatherAlive?: string | null;
  fatherAddress?: string | null;
  motherName?: string | null;
  motherAlive?: string | null;
  motherAddress?: string | null;
  nextOfKinName?: string | null;
  nextOfKinRelationship?: string | null;
  nextOfKinAddress?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinAltPhone?: string | null;
  nextOfKinEmail?: string | null;
  emergencyName?: string | null;
  emergencyAddress?: string | null;
  emergencyPhone?: string | null;
  dateEnding?: string | null;
  workPattern?: string | null;
  children?: string | null;
  education?: string | null;
  workHistory?: string | null;
}

const MY_RECORD_BASE = `title firstName otherNames lastName gender staffNumber department unit cadre rank position
  employmentType status phone email dateFirstAppointment dateCurrentRank
  licenceBody licencePin licenceExpiry cagdStaffId ssnit notes updatedAt`;
const MY_RECORD_BIODATA = `dateOfBirth nationality hometown hometownDistrict hometownRegion ghanaCard
  homeAddress gpsAddress residentialAddress religion maritalStatus spouseName
  fatherName fatherAlive fatherAddress motherName motherAlive motherAddress
  nextOfKinName nextOfKinRelationship nextOfKinAddress nextOfKinPhone nextOfKinAltPhone nextOfKinEmail
  emergencyName emergencyAddress emergencyPhone dateEnding workPattern children education workHistory`;
export const MY_STAFF_RECORD_QUERY = `query MyStaffRecord { myStaffRecord { ${MY_RECORD_BASE} ${MY_RECORD_BIODATA} } }`;
/** for WordPress still on a plugin before 1.23.0 */
export const MY_STAFF_RECORD_QUERY_LEGACY = `query MyStaffRecord { myStaffRecord { ${MY_RECORD_BASE} } }`;

export const AUDIT_ACTIONS: Record<string, string> = {
  viewed: "Opened staff records",
  created: "Added a record",
  updated: "Changed a record",
  deleted: "Deleted a record",
  exported: "Exported records",
  anonymised: "Retention clean-up",
  revealed: "Showed a hidden number",
  pin_set: "Set a reveal PIN",
  pin_locked: "Reveal PIN locked",
  settings: "Changed retention",
  viewed_own: "Viewed own record",
  encrypted: "Encrypted identifiers",
};

export const DELETE_EMPLOYEE = `mutation DeleteEmployee($id: Int!) { deleteEmployee(input: { id: $id }) { ok } }`;
export const SAVE_STRUCTURE = `mutation SaveStaffStructure($json: String!) { saveStaffStructure(input: { json: $json }) { json } }`;
export const SAVE_RANKS = `mutation SaveStaffRanks($json: String!) { saveStaffRanks(input: { json: $json }) { json } }`;

export function isMissingStaffPlugin(message: string) {
  return /staffSetup|employees|staffPortalUsers|saveEmployee|deleteEmployee|saveStaffStructure|saveStaffRanks/i.test(message)
    && /Cannot query field|Unknown|not exist/i.test(message);
}

export function employeeVariables(body: Record<string, unknown>) {
  const vars: Record<string, unknown> = {};
  for (const f of EMPLOYEE_INPUT_FIELDS) {
    if (f in body) vars[f] = body[f] == null ? "" : String(body[f]);
  }
  if ("userId" in body) vars.userId = Number(body.userId) || 0;
  return vars;
}

/* ── Biodata (HR's new staff forms) ─────────────────────────── */

export const GHANA_REGIONS = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East",
  "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North",
];

export const MARITAL_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

export const WORK_PATTERNS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "seasonal", label: "Seasonal" },
];

export interface ChildRow { name: string; sex: string; dob: string }
export interface EducationRow { institution: string; year: string; certificate: string }
export interface WorkRow { organisation: string; year: string; position: string }

/** A biodata list from its stored JSON; anything unreadable is treated as empty. */
export function parseList<T>(json: string | null | undefined): T[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

/** "••••6789" for account numbers shown outside the editor */
export function maskAccount(v: string | null | undefined) {
  const d = String(v ?? "").replace(/\s/g, "");
  return d.length > 4 ? `••••${d.slice(-4)}` : d;
}
