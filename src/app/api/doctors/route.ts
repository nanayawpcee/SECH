import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import { DOCTORS_QUERY, SAVE_DOCTOR, isMissingDoctorsPlugin, type Doctor } from "@/lib/doctors";
import { doctorVariables, revalidateDoctorPages } from "@/lib/doctors-data";

export const dynamic = "force-dynamic";

/** Every profile, including hidden ones, for the portal. */
export async function GET() {
  const gate = await requirePerm("doctors.manage");
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ doctors: Doctor[] | null }>(DOCTORS_QUERY, {}, { authenticated: true });
    return NextResponse.json({ doctors: data.doctors ?? [] });
  } catch (error) {
    if (error instanceof WpGraphQLError && isMissingDoctorsPlugin(error.message)) {
      return NextResponse.json({ doctors: [], needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/** Add a profile. */
export async function POST(request: Request) {
  const gate = await requirePerm("doctors.manage");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const input = doctorVariables(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    const data = await wpGraphQL<{ saveDoctor: { doctor: Doctor } }>(SAVE_DOCTOR, input.vars, { authenticated: true });
    revalidateDoctorPages();
    return NextResponse.json({ doctor: data.saveDoctor.doctor });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
