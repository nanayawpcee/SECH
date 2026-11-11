import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { ACC_LOG_EXPORT } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gate = await requirePerm("accounts");
  if (gate instanceof NextResponse) return gate;
  const b = await request.json().catch(() => null);
  const count = Number(b?.count);
  if (!Number.isInteger(count) || count < 0) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    await wpGraphQL(ACC_LOG_EXPORT, { count, range: String(b?.range ?? "").slice(0, 60) }, { authenticated: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
