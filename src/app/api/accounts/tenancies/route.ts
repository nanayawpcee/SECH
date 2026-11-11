import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { ACC_SAVE_TENANCY, type AccTenancy } from "@/lib/accounts";

export const dynamic = "force-dynamic";

// add a tenancy, or change one when body.id is given
export async function POST(request: Request) {
  const gate = await requirePerm("accounts");
  if (gate instanceof NextResponse) return gate;
  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  try {
    const data = await wpGraphQL<{ accSaveTenancy: { tenancy: AccTenancy } }>(
      ACC_SAVE_TENANCY,
      {
        id: Number(b.id) > 0 ? Number(b.id) : null,
        tenantName: String(b.tenantName ?? "").trim(),
        employeeId: Number(b.employeeId) > 0 ? Number(b.employeeId) : null,
        housingTypeId: String(b.housingTypeId ?? ""),
        unit: b.unit ? String(b.unit) : null,
        monthlyRate: Math.max(0, Math.round(Number(b.monthlyRate) || 0)),
        startMonth: String(b.startMonth ?? ""),
        endMonth: b.endMonth ? String(b.endMonth) : null,
      },
      { authenticated: true },
    );
    return NextResponse.json({ tenancy: data.accSaveTenancy.tenancy });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
