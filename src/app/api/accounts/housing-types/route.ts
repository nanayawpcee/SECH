import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { ACC_SAVE_HOUSING, type AccHousingType } from "@/lib/accounts";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const gate = await requirePerm("accounts");
  if (gate instanceof NextResponse) return gate;
  const b = await request.json().catch(() => null);
  if (!Array.isArray(b?.types)) return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  try {
    const data = await wpGraphQL<{ accSaveHousingTypes: { types: AccHousingType[] } }>(
      ACC_SAVE_HOUSING,
      { json: JSON.stringify(b.types) },
      { authenticated: true },
    );
    return NextResponse.json({ types: data.accSaveHousingTypes.types });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
