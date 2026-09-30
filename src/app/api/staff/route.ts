import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import {
  SAVE_EMPLOYEE,
  employeeVariables,
  STAFF_QUERY,
  isMissingStaffPlugin,
  type Employee,
  type PortalUserOption,
} from "@/lib/staff";

export const dynamic = "force-dynamic";

/** Everything the staff pages need, in one round trip. Staff managers only, never cached. */
export async function GET() {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ staffSetup: string; employees: Employee[] | null; staffPortalUsers: PortalUserOption[] | null }>(
      STAFF_QUERY,
      {},
      { authenticated: true },
    );
    const setup = JSON.parse(data.staffSetup || "{}");
    return NextResponse.json({
      setup: { structure: setup.structure, ranks: setup.ranks },
      employees: data.employees ?? [],
      portalUsers: data.staffPortalUsers ?? [],
    });
  } catch (error) {
    if (error instanceof WpGraphQLError && isMissingStaffPlugin(error.message)) {
      return NextResponse.json({ setup: null, employees: [], portalUsers: [], needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/** Add a staff record. */
export async function POST(request: Request) {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  if (!String(body.firstName ?? "").trim() || !String(body.lastName ?? "").trim()) {
    return NextResponse.json({ error: "First name and surname are required." }, { status: 400 });
  }
  try {
    const data = await wpGraphQL<{ saveEmployee: { employee: Employee } }>(
      SAVE_EMPLOYEE,
      employeeVariables(body),
      { authenticated: true },
    );
    return NextResponse.json({ employee: data.saveEmployee.employee });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
