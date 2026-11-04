import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import { LOG_STAFF_EXPORT, isOutdatedStaffPlugin } from "@/lib/staff";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  const count = Number(body?.count);
  if (!Number.isInteger(count) || count < 0) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    await wpGraphQL(LOG_STAFF_EXPORT, { count, withIdentifiers: !!body?.withIdentifiers }, { authenticated: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WpGraphQLError && isOutdatedStaffPlugin(error.message)) {
      return NextResponse.json({ ok: true, logged: false });
    }
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
