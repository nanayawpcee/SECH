import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { ACC_RECORD, categoryOf, type AccTransaction } from "@/lib/accounts";

export const dynamic = "force-dynamic";

const optText = (v: unknown, max: number) => (v ? String(v).slice(0, max) : null);
const optInt = (v: unknown) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

export async function POST(request: Request) {
  const gate = await requirePerm("accounts");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const category = String(body.category ?? "");
  if (!categoryOf(category)) return NextResponse.json({ error: "Choose a category." }, { status: 400 });
  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) return NextResponse.json({ error: "Enter the amount." }, { status: 400 });
  try {
    const data = await wpGraphQL<{ accRecordTransaction: { transaction: AccTransaction } }>(
      ACC_RECORD,
      {
        category,
        party: String(body.party ?? "").trim(),
        amount,
        phone: body.phone ? String(body.phone) : null,
        description: body.description ? String(body.description) : null,
        details: JSON.stringify(body.details && typeof body.details === "object" ? body.details : {}),
        advanceId: optInt(body.advanceId),
        tenancyId: optInt(body.tenancyId),
        employeeId: optInt(body.employeeId),
        monthlyDeduction: Number.isInteger(Number(body.monthlyDeduction)) ? Number(body.monthlyDeduction) : 0,
        purpose: body.purpose ? String(body.purpose) : null,
        // checked and tidied by the plugin
        ghanaCard: optText(body.ghanaCard, 40),
        department: optText(body.department, 120),
        manualRef: optText(typeof body.manualRef === "string" ? body.manualRef.trim() : "", 40),
      },
      { authenticated: true },
    );
    return NextResponse.json({ transaction: data.accRecordTransaction.transaction });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
