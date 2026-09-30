import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { DELETE_EMPLOYEE, SAVE_EMPLOYEE, employeeVariables, type Employee } from "@/lib/staff";

export const dynamic = "force-dynamic";

function idFrom(params: { id: string }) {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Update a staff record. Staff managers only. */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  const body = await request.json().catch(() => null);
  if (!id || !body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    const data = await wpGraphQL<{ saveEmployee: { employee: Employee } }>(
      SAVE_EMPLOYEE,
      { ...employeeVariables(body), databaseId: id },
      { authenticated: true },
    );
    return NextResponse.json({ employee: data.saveEmployee.employee });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}

/** Delete a staff record for good (for mistakes; people who leave are marked "Left"). */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  const id = idFrom(params);
  if (!id) return NextResponse.json({ error: "No such staff record." }, { status: 400 });
  try {
    await wpGraphQL(DELETE_EMPLOYEE, { id }, { authenticated: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
