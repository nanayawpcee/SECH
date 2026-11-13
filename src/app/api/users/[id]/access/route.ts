import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { ACCOUNTS_PERMISSIONS } from "@/lib/accounts";
import { EXTRA_ACCESS, type ExtraAccess } from "@/lib/wp-users";

export const dynamic = "force-dynamic";

const SET_EXTRA = `mutation SetExtraAccess($userId: Int!, $access: [String]!) {
  setExtraAccess(input: { userId: $userId, access: $access }) { access { key granted fromRole } }
}`;
const SET_ACCOUNTS = `mutation AccSetPermissions($userId: Int!, $permissions: [String]!) {
  accSetPermissions(input: { userId: $userId, permissions: $permissions }) { permissions }
}`;

const pick = (v: unknown, allowed: readonly string[]) =>
  Array.isArray(v) ? v.filter((p): p is string => typeof p === "string" && allowed.includes(p)) : null;

/**
 * Sets the everyday access ("access") and, for accounts officers, the accounts
 * permissions ("accounts") of one person. Administrators only; the plugin checks again.
 */
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const gate = await requirePerm("settings");
  if (gate instanceof NextResponse) return gate;
  const userId = Number(params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as { access?: unknown; accounts?: unknown };
  const access = pick(body.access, EXTRA_ACCESS.map((a) => a.key));
  const accounts = pick(body.accounts, ACCOUNTS_PERMISSIONS.map((p) => p.key));

  try {
    const out: { extraAccess?: ExtraAccess[]; accountsPermissions?: string[] } = {};
    if (access) {
      const d = await wpGraphQL<{ setExtraAccess: { access: ExtraAccess[] } }>(SET_EXTRA, { userId, access }, { authenticated: true });
      out.extraAccess = d.setExtraAccess.access ?? [];
    }
    if (accounts) {
      const d = await wpGraphQL<{ accSetPermissions: { permissions: string[] } }>(SET_ACCOUNTS, { userId, permissions: accounts }, { authenticated: true });
      out.accountsPermissions = d.accSetPermissions.permissions ?? [];
    }
    return NextResponse.json(out);
  } catch (error) {
    const { body: b, status } = toErrorResponse(error);
    return NextResponse.json(b, { status });
  }
}
