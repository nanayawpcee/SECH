import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { can } from "@/lib/permissions";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import {
  ACC_OVERVIEW_QUERY,
  isMissingAccountsPlugin,
  type AccAdvance,
  type AccHousingType,
  type AccStaffOption,
  type AccTenancy,
  type AccTransaction,
} from "@/lib/accounts";

// money records, never cache
export const dynamic = "force-dynamic";

type Overview = {
  accTransactions: AccTransaction[] | null;
  accAdvances: AccAdvance[] | null;
  accTenancies: AccTenancy[] | null;
  accHousingTypes: AccHousingType[] | null;
  accStaffOptions: AccStaffOption[] | null;
};

const isDay = (v: string | null) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function GET(request: Request) {
  const gate = await requirePerm("accounts");
  if (gate instanceof NextResponse) return gate;
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  try {
    const data = await wpGraphQL<Overview>(
      ACC_OVERVIEW_QUERY,
      { from: isDay(from) ? from : null, to: isDay(to) ? to : null },
      { authenticated: true },
    );
    return NextResponse.json(
      {
        transactions: data.accTransactions ?? [],
        advances: data.accAdvances ?? [],
        tenancies: data.accTenancies ?? [],
        housingTypes: data.accHousingTypes ?? [],
        staff: data.accStaffOptions ?? [],
        canAudit: can(gate.perms, "settings"),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof WpGraphQLError && isMissingAccountsPlugin(error.message)) {
      return NextResponse.json({ needsPlugin: true, transactions: [], advances: [], tenancies: [], housingTypes: [], staff: [] });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
