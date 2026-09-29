import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { MARK_NOTICE_READ, type StaffNotice } from "@/lib/wp-notices";

export const dynamic = "force-dynamic";

/** "I've read this" — any signed-in staff member, for themselves only. */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm();
  if (gate instanceof NextResponse) return gate;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid notice." }, { status: 400 });
  try {
    const data = await wpGraphQL<{ markStaffNoticeRead: { notice: StaffNotice } }>(
      MARK_NOTICE_READ,
      { databaseId: id },
      { authenticated: true },
    );
    return NextResponse.json({ notice: data.markStaffNoticeRead.notice });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
