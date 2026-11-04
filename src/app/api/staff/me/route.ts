import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import { MY_STAFF_RECORD_QUERY, isOutdatedStaffPlugin, type MyStaffRecord } from "@/lib/staff";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requirePerm();
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ myStaffRecord: MyStaffRecord | null }>(MY_STAFF_RECORD_QUERY, {}, { authenticated: true });
    return NextResponse.json({ record: data.myStaffRecord }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WpGraphQLError && isOutdatedStaffPlugin(error.message)) {
      return NextResponse.json({ record: null, needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
