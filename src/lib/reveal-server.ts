// Server side of the reveal PIN: GraphQL documents and error replies.
import { NextResponse } from "next/server";
import { WpGraphQLError, toErrorResponse } from "@/lib/wp-graphql";

export const REVEAL_STATUS_QUERY = `query RevealPinStatus { revealPinStatus { hasPin unlockedFor lockedFor } }`;
export const SET_REVEAL_PIN = `mutation SetRevealPin($password: String!, $pin: String!) { setRevealPin(input: { password: $password, pin: $pin }) { ok } }`;
export const REVEAL_VALUE = `mutation RevealStaffValue($employeeId: Int, $field: String!, $pin: String) {
  revealStaffValue(input: { employeeId: $employeeId, field: $field, pin: $pin }) { value } }`;
export const REVEAL_IDENTIFIERS = `mutation RevealStaffIdentifiers($ids: [Int], $pin: String) {
  revealStaffIdentifiers(input: { ids: $ids, pin: $pin }) { json } }`;

/** Turns the plugin's "PIN_WRONG: That PIN is not right…" into a reply the portal can act on */
export function revealErrorResponse(error: unknown) {
  if (error instanceof WpGraphQLError) {
    const m = /^(PIN_[A-Z_]+):\s*([\s\S]*)$/.exec(error.message);
    if (m) {
      return NextResponse.json({ error: m[2], code: m[1] }, { status: m[1] === "PIN_LOCKED" ? 423 : 400, headers: { "Cache-Control": "no-store" } });
    }
    if (/revealPinStatus|setRevealPin|revealStaffValue|revealStaffIdentifiers/.test(error.message) && /Cannot query field|Unknown|not exist|not defined/i.test(error.message)) {
      return NextResponse.json({ error: "This needs the latest version of the portal on the hospital’s WordPress site.", code: "NEEDS_PLUGIN" }, { status: 400 });
    }
  }
  const { body, status } = toErrorResponse(error);
  return NextResponse.json(body, { status });
}
