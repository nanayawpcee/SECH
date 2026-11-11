import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { DELETE_MESSAGE, UPDATE_MESSAGE, type ContactMessage } from "@/lib/wp-messages";

export const dynamic = "force-dynamic";

function idFrom(params: { id: string }) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const gate = await requirePerm("messages");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  const { status } = await request.json().catch(() => ({}));
  if (!id || !["new", "read", "done"].includes(status)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const data = await wpGraphQL<{ updateContactMessage: { message: ContactMessage } }>(
      UPDATE_MESSAGE,
      { id, status },
      { authenticated: true },
    );
    return NextResponse.json({ message: data.updateContactMessage.message });
  } catch (error) {
    const { body, status: code } = toErrorResponse(error);
    return NextResponse.json(body, { status: code });
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const gate = await requirePerm("messages");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  if (!id) return NextResponse.json({ error: "No such message." }, { status: 400 });
  try {
    await wpGraphQL(DELETE_MESSAGE, { id }, { authenticated: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
