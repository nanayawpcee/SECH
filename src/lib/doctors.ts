/**
 * Doctors and specialists directory (SECH Portal plugin 1.8.0, section 15).
 * Shared by the portal, the API routes and the public pages.
 */

export type Doctor = {
  databaseId: number;
  title: string | null;
  name: string;
  specialty: string | null;
  /** Website service slugs (see SERVICES in data.tsx) this person works in. */
  services: string[];
  clinicDays: DayCode[];
  clinicHours: string | null;
  bio: string | null;
  photoId: number | null;
  photoUrl: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type DoctorInput = {
  title: string;
  name: string;
  specialty: string;
  services: string[];
  clinicDays: DayCode[];
  clinicHours: string;
  bio: string;
  photoId: number;
  published: boolean;
  sortOrder: number;
};

export const DAYS = [
  { code: "mon", short: "Mon", long: "Monday" },
  { code: "tue", short: "Tue", long: "Tuesday" },
  { code: "wed", short: "Wed", long: "Wednesday" },
  { code: "thu", short: "Thu", long: "Thursday" },
  { code: "fri", short: "Fri", long: "Friday" },
  { code: "sat", short: "Sat", long: "Saturday" },
  { code: "sun", short: "Sun", long: "Sunday" },
] as const;

export type DayCode = (typeof DAYS)[number]["code"];

export const DOCTOR_TITLES = ["Dr.", "Prof.", "Rev. Dr.", "Sr. Dr.", "Mr.", "Mrs.", "Ms."];

export const BIO_MAX = 600;

/** "Dr. Ama Mensah", without doubling a title already typed into the name. */
export function doctorName(d: Pick<Doctor, "title" | "name">) {
  const title = d.title?.trim();
  if (!title || d.name.toLowerCase().startsWith(title.toLowerCase())) return d.name;
  return `${title} ${d.name}`;
}

/** "Mon, Wed and Fri", or "Mon to Fri" for a run of three or more days. */
export function formatDays(days: readonly string[]) {
  const idx = DAYS.map((d) => d.code as string);
  const picked = idx.filter((c) => days.includes(c));
  if (!picked.length) return "";
  const nums = picked.map((c) => idx.indexOf(c));
  const isRun = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  const short = (c: string) => DAYS.find((d) => d.code === c)!.short;
  if (picked.length >= 3 && isRun) return `${short(picked[0])} to ${short(picked[picked.length - 1])}`;
  if (picked.length === 1) return DAYS.find((d) => d.code === picked[0])!.long;
  return `${picked.slice(0, -1).map(short).join(", ")} and ${short(picked[picked.length - 1])}`;
}

const DOCTOR_FIELDS = `
  databaseId title name specialty services clinicDays clinicHours bio
  photoId photoUrl photoWidth photoHeight published sortOrder updatedAt
`;

export const PUBLIC_DOCTORS_QUERY = `query PublicDoctors { publicDoctors { ${DOCTOR_FIELDS} } }`;
export const DOCTORS_QUERY = `query Doctors { doctors { ${DOCTOR_FIELDS} } }`;

export const SAVE_DOCTOR = `
  mutation SaveDoctor(
    $databaseId: Int, $title: String, $name: String, $specialty: String, $services: [String],
    $clinicDays: [String], $clinicHours: String, $bio: String, $photoId: Int,
    $published: Boolean, $sortOrder: Int
  ) {
    saveDoctor(input: {
      databaseId: $databaseId, title: $title, name: $name, specialty: $specialty, services: $services,
      clinicDays: $clinicDays, clinicHours: $clinicHours, bio: $bio, photoId: $photoId,
      published: $published, sortOrder: $sortOrder
    }) { doctor { ${DOCTOR_FIELDS} } }
  }
`;

export const DELETE_DOCTOR = `mutation DeleteDoctor($id: Int!) { deleteDoctor(input: { id: $id }) { ok } }`;

/** WordPress hasn't got plugin 1.8.0 yet. */
export function isMissingDoctorsPlugin(message: string) {
  return /publicDoctors|doctors|saveDoctor|deleteDoctor/i.test(message) && /Cannot query field|Unknown|not exist/i.test(message);
}
