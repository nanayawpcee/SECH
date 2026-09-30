import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { SAVE_RANKS, SAVE_STRUCTURE } from "@/lib/staff";

export const dynamic = "force-dynamic";

/**
 * Save departments & units ({ kind: "structure" }) or cadres, ranks and
 * positions ({ kind: "ranks" }). The plugin cleans the lists and refuses to
 * drop anything staff are still assigned to.
 */
export async function PUT(request: Request) {
  const gate = await requirePerm("staff.manage");
  if (gate instanceof NextResponse) return gate;
  const body = await request.json().catch(() => null);
  const kind = body?.kind;
  if ((kind !== "structure" && kind !== "ranks") || typeof body.data !== "object" || !body.data) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const mutation = kind === "structure" ? SAVE_STRUCTURE : SAVE_RANKS;
    const data = await wpGraphQL<Record<string, { json: string }>>(
      mutation,
      { json: JSON.stringify(body.data) },
      { authenticated: true },
    );
    const saved = kind === "structure" ? data.saveStaffStructure : data.saveStaffRanks;
    return NextResponse.json({ data: JSON.parse(saved.json) });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    return NextResponse.json(err, { status });
  }
}
