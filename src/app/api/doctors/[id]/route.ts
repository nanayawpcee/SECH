import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { DELETE_DOCTOR, SAVE_DOCTOR, type Doctor } from "@/lib/doctors";
import { doctorVariables, revalidateDoctorPages } from "@/lib/doctors-data";

export const dynamic = "force-dynamic";

function idFrom(params: { id: string }) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Update a profile. */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("doctors.manage");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  const body = await request.json().catch(() => null);
  if (!id || !body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = doctorVariables(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
  try {
    const data = await wpGraphQL<{ saveDoctor: { doctor: Doctor } }>(
      SAVE_DOCTOR,
      { ...input.vars, databaseId: id },
      { authenticated: true },
    );
    revalidateDoctorPages();
    return NextResponse.json({ doctor: data.saveDoctor.doctor });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}

/** Remove a profile for good. Hiding it (unpublishing) keeps it for later. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("doctors.manage");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  if (!id) return NextResponse.json({ error: "No such profile." }, { status: 400 });
  try {
    await wpGraphQL(DELETE_DOCTOR, { id }, { authenticated: true });
    revalidateDoctorPages();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
