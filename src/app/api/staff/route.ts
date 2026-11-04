import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import {
  employeeVariables,
  saveEmployeeCompat,
  STAFF_QUERY,
  STAFF_QUERY_LEGACY,
  isMissingStaffPlugin,
  isOutdatedStaffPlugin,
  type Employee,
  type PortalUserOption,
} from "@/lib/staff";

// staff personal data, never cache
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  type StaffData = { staffSetup: string; employees: Employee[] | null; staffPortalUsers: PortalUserOption[] | null };
  try {
    let data: StaffData;
    let pluginOutdated = false;
    try {
      data = await wpGraphQL<StaffData>(STAFF_QUERY, {}, { authenticated: true });
    } catch (error) {
      if (!(error instanceof WpGraphQLError) || !isOutdatedStaffPlugin(error.message)) throw error;
      data = await wpGraphQL<StaffData>(STAFF_QUERY_LEGACY, {}, { authenticated: true });
      pluginOutdated = true;
    }
    const setup = JSON.parse(data.staffSetup || "{}");
    return NextResponse.json({
      setup: { structure: setup.structure, ranks: setup.ranks },
      employees: data.employees ?? [],
      portalUsers: data.staffPortalUsers ?? [],
      pluginOutdated,
    });
  } catch (error) {
    if (error instanceof WpGraphQLError && isMissingStaffPlugin(error.message)) {
      return NextResponse.json({ setup: null, employees: [], portalUsers: [], needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  if (!String(body.firstName ?? "").trim() || !String(body.lastName ?? "").trim()) {
    return NextResponse.json({ error: "First name and surname are required." }, { status: 400 });
  }
  try {
    const data = await saveEmployeeCompat(
      (query, vars) => wpGraphQL<{ saveEmployee: { employee: Employee } }>(query, vars, { authenticated: true }),
      employeeVariables(body),
      (e) => e instanceof WpGraphQLError && isOutdatedStaffPlugin(e.message),
    );
    return NextResponse.json({ employee: data.saveEmployee.employee });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
