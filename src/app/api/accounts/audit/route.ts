import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { ACC_AUDIT_QUERY, type AccAuditEntry } from "@/lib/accounts";

export const dynamic = "force-dynamic";

// administrators only: accounts officers are in this log
export async function GET() {
  const gate = await requirePerm("accounts", "settings");
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ accAudit: AccAuditEntry[] | null }>(ACC_AUDIT_QUERY, { first: 500 }, { authenticated: true });
    return NextResponse.json({ entries: data.accAudit ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
