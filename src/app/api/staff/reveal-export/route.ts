import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL } from "@/lib/wp-graphql";
import { REVEAL_IDENTIFIERS, revealErrorResponse } from "@/lib/reveal-server";

export const dynamic = "force-dynamic";

/** Every identifier on the listed records, for an export HR has asked to include them in */
export async function POST(request: Request) {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.map(Number).filter((n: number) => Number.isInteger(n) && n > 0).slice(0, 2000) : [];
  const pin = typeof body?.pin === "string" ? body.pin.replace(/\D/g, "").slice(0, 6) : "";
  if (!ids.length) return NextResponse.json({ values: {} });
  try {
    const data = await wpGraphQL<{ revealStaffIdentifiers: { json: string } }>(
      REVEAL_IDENTIFIERS, { ids, pin: pin || null }, { authenticated: true },
    );
    return NextResponse.json({ values: JSON.parse(data.revealStaffIdentifiers.json || "{}") }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return revealErrorResponse(error);
  }
}
