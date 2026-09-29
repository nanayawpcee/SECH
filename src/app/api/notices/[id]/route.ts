import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { SAVE_NOTICE, DELETE_NOTICE, noticeVariables, type StaffNotice } from "@/lib/wp-notices";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

function noticeId(params: Params["params"]) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: Params) {
  const gate = await requirePerm("notices.manage");
  if (gate instanceof NextResponse) return gate;
  const id = noticeId(params);
  if (!id) return NextResponse.json({ error: "Invalid notice." }, { status: 400 });
  try {
    const input = await request.json();
    if (!String(input.title ?? "").trim()) {
      return NextResponse.json({ error: "A notice needs a title." }, { status: 400 });
    }
    const data = await wpGraphQL<{ saveStaffNotice: { notice: StaffNotice } }>(
      SAVE_NOTICE,
      noticeVariables(input, id),
      { authenticated: true },
    );
    revalidatePath("/notices", "layout"); // the public share pages
    return NextResponse.json({ notice: data.saveStaffNotice.notice });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/** Moves the notice to the WordPress trash (recoverable for 30 days). */
export async function DELETE(_request: Request, { params }: Params) {
  const gate = await requirePerm("notices.manage");
  if (gate instanceof NextResponse) return gate;
  const id = noticeId(params);
  if (!id) return NextResponse.json({ error: "Invalid notice." }, { status: 400 });
  try {
    await wpGraphQL(DELETE_NOTICE, { databaseId: id }, { authenticated: true });
    revalidatePath("/notices", "layout");
    return NextResponse.json({ deletedId: id });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
