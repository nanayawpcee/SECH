import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { generateTempPassword } from "@/lib/temp-password";

export const dynamic = "force-dynamic";

const RESET = `
  mutation ResetStaffPassword($userId: Int!, $password: String!) {
    resetStaffPassword(input: { userId: $userId, password: $password }) { userId emailedTo hasEmail }
  }
`;

// plugin 1.15.0 and earlier don't email the person
const RESET_OLD = `
  mutation ResetStaffPassword($userId: Int!, $password: String!) {
    resetStaffPassword(input: { userId: $userId, password: $password }) { userId }
  }
`;

type ResetResult = { resetStaffPassword: { userId: number; emailedTo?: string | null; hasEmail?: boolean | null } };

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const gate = await requirePerm("team");
  if (gate instanceof NextResponse) return gate;
  const userId = Number(params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid account." }, { status: 400 });
  }
  if (userId === gate.id) {
    return NextResponse.json({ error: "Change your own password from Settings → Security." }, { status: 400 });
  }
  try {
    const password = generateTempPassword();
    let result: ResetResult;
    try {
      result = await wpGraphQL<ResetResult>(RESET, { userId, password }, { authenticated: true });
    } catch (error) {
      // only a schema mismatch retries; nothing was changed in that case
      if (!/emailedTo|hasEmail/.test(String((error as Error)?.message ?? ""))) throw error;
      result = await wpGraphQL<ResetResult>(RESET_OLD, { userId, password }, { authenticated: true });
    }
    const r = result.resetStaffPassword;
    return NextResponse.json(
      { temporaryPassword: password, emailedTo: r.emailedTo ?? null, hasEmail: r.hasEmail ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
