import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import { MY_STAFF_RECORD_QUERY, MY_STAFF_RECORD_QUERY_LEGACY, isOutdatedStaffPlugin, type MyStaffRecord } from "@/lib/staff";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requirePerm();
  if (gate instanceof NextResponse) return gate;
  try {
    type Data = { myStaffRecord: MyStaffRecord | null };
    let data: Data;
    try {
      data = await wpGraphQL<Data>(MY_STAFF_RECORD_QUERY, {}, { authenticated: true });
    } catch (error) {
      // the biodata fields arrive with plugin 1.23.0; show the rest until then
      if (!(error instanceof WpGraphQLError) || !isOutdatedStaffPlugin(error.message) || /myStaffRecord/.test(error.message)) throw error;
      data = await wpGraphQL<Data>(MY_STAFF_RECORD_QUERY_LEGACY, {}, { authenticated: true });
    }
    return NextResponse.json({ record: data.myStaffRecord }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WpGraphQLError && isOutdatedStaffPlugin(error.message)) {
      return NextResponse.json({ record: null, needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
