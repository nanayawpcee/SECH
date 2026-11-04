import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { can } from "@/lib/permissions";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import {
  SET_STAFF_RETENTION,
  STAFF_AUDIT_QUERY,
  STAFF_DP_QUERY,
  isOutdatedStaffPlugin,
  type StaffAuditEntry,
  type StaffDataProtection,
} from "@/lib/staff";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  const isAdmin = can(gate.perms, "settings");
  try {
    const dp = await wpGraphQL<{ staffDataProtection: StaffDataProtection }>(STAFF_DP_QUERY, {}, { authenticated: true });
    const audit = isAdmin
      ? (await wpGraphQL<{ staffAudit: StaffAuditEntry[] | null }>(STAFF_AUDIT_QUERY, { first: 300 }, { authenticated: true })).staffAudit ?? []
      : null;
    return NextResponse.json({ status: dp.staffDataProtection, audit, canManage: isAdmin });
  } catch (error) {
    if (error instanceof WpGraphQLError && isOutdatedStaffPlugin(error.message)) {
      return NextResponse.json({ status: null, audit: null, canManage: isAdmin, needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(request: Request) {
  const gate = await requirePerm("staff.manage", "settings");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  const years = Number(body?.years);
  if (!Number.isInteger(years) || years < 0 || years > 50) {
    return NextResponse.json({ error: "Choose between 0 (keep) and 50 years." }, { status: 400 });
  }
  try {
    const data = await wpGraphQL<{ setStaffRetention: { years: number } }>(SET_STAFF_RETENTION, { years }, { authenticated: true });
    return NextResponse.json({ years: data.setStaffRetention.years });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
