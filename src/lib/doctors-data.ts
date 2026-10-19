import "server-only";
import { SERVICES } from "@/lib/data";
import { wpQuery } from "@/lib/wp-graphql";
import { revalidatePath } from "next/cache";
import { BIO_MAX, DAYS, PUBLIC_DOCTORS_QUERY, type Doctor, type DoctorInput } from "@/lib/doctors";

const KNOWN_SERVICES = new Set<string>(SERVICES.map((s) => s.slug));
const DAY_CODES = new Set<string>(DAYS.map((d) => d.code));

/**
 * A portal request body, checked and trimmed into mutation variables.
 * Returns an error message for anything a person needs to fix.
 */
export function doctorVariables(body: Record<string, unknown>): { ok: true; vars: DoctorInput } | { ok: false; error: string } {
  const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const name = text(body.name, 80);
  if (!name) return { ok: false, error: "A name is required." };
  const bio = String(body.bio ?? "").trim();
  if (bio.length > BIO_MAX) return { ok: false, error: `Keep the bio to ${BIO_MAX} characters.` };
  const services = Array.isArray(body.services) ? body.services.map(String) : [];
  const unknown = services.filter((s) => !KNOWN_SERVICES.has(s));
  if (unknown.length) return { ok: false, error: "One of the linked services no longer exists on the website." };
  const days = Array.isArray(body.clinicDays) ? body.clinicDays.map(String) : [];
  if (days.some((d) => !DAY_CODES.has(d))) return { ok: false, error: "Unknown clinic day." };
  const order = Number(body.sortOrder ?? 0);
  return {
    ok: true,
    vars: {
      title: text(body.title, 24),
      name,
      specialty: text(body.specialty, 80),
      services: Array.from(new Set(services)).slice(0, 8),
      clinicDays: days as DoctorInput["clinicDays"],
      clinicHours: text(body.clinicHours, 60),
      bio,
      photoId: Number.isInteger(Number(body.photoId)) && Number(body.photoId) > 0 ? Number(body.photoId) : 0,
      published: body.published === true,
      sortOrder: Number.isFinite(order) ? Math.max(0, Math.min(999, Math.round(order))) : 0,
    },
  };
}

/** After any change: the directory and every service page show profiles. */
export function revalidateDoctorPages() {
  revalidatePath("/doctors");
  revalidatePath("/services/[slug]", "page");
}

/**
 * Published profiles, in display order. [] when WordPress is unreachable or
 * doesn't have plugin 1.8.0 yet, so the pages fall back to their empty state.
 * Links to services that no longer exist on the site are dropped.
 */
export async function getPublicDoctors(): Promise<Doctor[]> {
  const data = await wpQuery<{ publicDoctors: Doctor[] | null }>(PUBLIC_DOCTORS_QUERY, {}, 300);
  return (data?.publicDoctors ?? []).map((d) => ({
    ...d,
    services: (d.services ?? []).filter((s) => KNOWN_SERVICES.has(s)),
    clinicDays: d.clinicDays ?? [],
  }));
}

/** Published specialists linked to one service page. */
export async function getDoctorsForService(slug: string): Promise<Doctor[]> {
  return (await getPublicDoctors()).filter((d) => d.services.includes(slug));
}
