import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { ACC_LOG_PRINT, ACC_TXN_QUERY, ACC_VOID, type AccTransaction } from "@/lib/accounts";

export const dynamic = "force-dynamic";

function idFrom(params: { id: string }) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("accounts");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  if (!id) return NextResponse.json({ error: "No such receipt." }, { status: 404 });
  try {
    const data = await wpGraphQL<{ accTransaction: AccTransaction | null }>(ACC_TXN_QUERY, { id }, { authenticated: true });
    if (!data.accTransaction) return NextResponse.json({ error: "No such receipt." }, { status: 404 });
    return NextResponse.json({ transaction: data.accTransaction }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

// { action: "void", reason } or { action: "print" }
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("accounts");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  const body = await request.json().catch(() => null);
  if (!id || !body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    if (body.action === "void") {
      const reason = String(body.reason ?? "").trim();
      if (reason.length < 5) return NextResponse.json({ error: "Give a reason for voiding." }, { status: 400 });
      const data = await wpGraphQL<{ accVoidTransaction: { transaction: AccTransaction } }>(ACC_VOID, { id, reason }, { authenticated: true });
      return NextResponse.json({ transaction: data.accVoidTransaction.transaction });
    }
    if (body.action === "print") {
      const data = await wpGraphQL<{ accLogPrint: { printCount: number } }>(ACC_LOG_PRINT, { id }, { authenticated: true });
      return NextResponse.json({ printCount: data.accLogPrint.printCount });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
