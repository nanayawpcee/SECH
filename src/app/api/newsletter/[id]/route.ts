import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { DELETE_SUBSCRIBER } from "@/lib/wp-newsletter";

export const dynamic = "force-dynamic";

/** Erase a subscriber entirely — for data-protection requests. Administrators only. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("newsletter");
  if (gate instanceof NextResponse) return gate;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "No such subscriber." }, { status: 400 });
  }
  try {
    await wpGraphQL(DELETE_SUBSCRIBER, { id }, { authenticated: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
