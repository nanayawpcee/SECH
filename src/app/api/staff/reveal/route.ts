import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL } from "@/lib/wp-graphql";
import { isSecretField } from "@/lib/reveal";
import { REVEAL_VALUE, revealErrorResponse } from "@/lib/reveal-server";

export const dynamic = "force-dynamic";

/**
 * One hidden identifier in full. Leave out employeeId for your own record.
 * WordPress checks the PIN (or the open 5-minute window), who may see it, and logs it.
 */
export async function POST(request: Request) {
  const gate = await requirePerm();
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  const field = typeof body?.field === "string" ? body.field : "";
  if (!isSecretField(field)) return NextResponse.json({ error: "That detail is not hidden." }, { status: 400 });
  const employeeId = Number(body?.employeeId) || null;
  const pin = typeof body?.pin === "string" ? body.pin.replace(/\D/g, "").slice(0, 6) : "";
  try {
    const data = await wpGraphQL<{ revealStaffValue: { value: string | null } }>(
      REVEAL_VALUE, { employeeId, field, pin: pin || null }, { authenticated: true },
    );
    return NextResponse.json({ value: data.revealStaffValue.value ?? "" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return revealErrorResponse(error);
  }
}
