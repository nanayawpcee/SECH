import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL } from "@/lib/wp-graphql";
import { REVEAL_STATUS_QUERY, SET_REVEAL_PIN, revealErrorResponse } from "@/lib/reveal-server";

export const dynamic = "force-dynamic";

/** Whether the signed-in person has a reveal PIN, and any open window or lock */
export async function GET() {
  const gate = await requirePerm();
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ revealPinStatus: { hasPin: boolean; unlockedFor: number; lockedFor: number } }>(
      REVEAL_STATUS_QUERY, {}, { authenticated: true },
    );
    return NextResponse.json(data.revealPinStatus, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return revealErrorResponse(error);
  }
}

/** Sets or changes the reveal PIN; the account password confirms it is really them */
export async function POST(request: Request) {
  const gate = await requirePerm();
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  if (!password) return NextResponse.json({ error: "Enter your account password.", code: "PIN_INVALID" }, { status: 400 });
  if (!/^\d{4,6}$/.test(pin)) return NextResponse.json({ error: "The PIN must be 4 to 6 digits.", code: "PIN_INVALID" }, { status: 400 });
  try {
    await wpGraphQL(SET_REVEAL_PIN, { password, pin }, { authenticated: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return revealErrorResponse(error);
  }
}
