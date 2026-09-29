import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { generateTempPassword } from "@/lib/temp-password";

export const dynamic = "force-dynamic";

const RESET = `
  mutation ResetStaffPassword($userId: Int!, $password: String!) {
    resetStaffPassword(input: { userId: $userId, password: $password }) { userId }
  }
`;

/**
 * Give a staff member a new temporary password — for someone who has
 * forgotten theirs and has no email to reset it. WordPress signs them out
 * everywhere and requires a new password at their next sign-in. It refuses
 * for administrators and for your own account.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
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
    await wpGraphQL(RESET, { userId, password }, { authenticated: true });
    return NextResponse.json({ temporaryPassword: password }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
