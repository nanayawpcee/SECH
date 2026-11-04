import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import { STAFF_NOTICES_QUERY, SAVE_NOTICE, isMissingPlugin, noticeVariables, type StaffNotice } from "@/lib/wp-notices";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requirePerm();
  if (gate instanceof NextResponse) return gate;
  const includeExpired =
    new URL(request.url).searchParams.get("all") === "1" && gate.perms.includes("notices.manage");
  try {
    const data = await wpGraphQL<{ staffNotices: StaffNotice[] | null }>(
      STAFF_NOTICES_QUERY,
      { includeExpired },
      { authenticated: true },
    );
    return NextResponse.json({ notices: data.staffNotices ?? [] });
  } catch (error) {
    if (error instanceof WpGraphQLError && isMissingPlugin(error.message)) {
      return NextResponse.json({ notices: [], needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  const gate = await requirePerm("notices.manage");
  if (gate instanceof NextResponse) return gate;
  try {
    const input = await request.json();
    if (!String(input.title ?? "").trim()) {
      return NextResponse.json({ error: "A notice needs a title." }, { status: 400 });
    }
    const data = await wpGraphQL<{ saveStaffNotice: { notice: StaffNotice } }>(
      SAVE_NOTICE,
      noticeVariables(input),
      { authenticated: true },
    );
    revalidatePath("/notices", "layout");
    return NextResponse.json({ notice: data.saveStaffNotice.notice });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
