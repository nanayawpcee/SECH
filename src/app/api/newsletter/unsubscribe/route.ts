import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { UNSUBSCRIBE } from "@/lib/wp-newsletter";

export const dynamic = "force-dynamic";

/**
 * Public: the button on /newsletter/unsubscribe. The token in each email's
 * link is the only credential — long and random, and it can only ever remove
 * that one address from the list.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token ?? "").replace(/[^A-Za-z0-9]/g, "");
  if (token.length < 20) {
    return NextResponse.json({ error: "This unsubscribe link is not valid." }, { status: 400 });
  }

  const key = process.env.SECH_BOOKING_KEY;
  if (!key) {
    console.error("SECH_BOOKING_KEY is not set, so unsubscribe requests cannot be saved.");
    return NextResponse.json({ error: "This isn’t working right now. Please email us to unsubscribe." }, { status: 503 });
  }

  try {
    await wpGraphQL(UNSUBSCRIBE, { token }, { headers: { "X-SECH-BOOKING-KEY": key } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    const invalid = /not valid/i.test(err.error);
    return NextResponse.json(
      { error: invalid ? "This unsubscribe link is not valid." : "This isn’t working right now. Please email us to unsubscribe." },
      { status: invalid ? 400 : status >= 500 ? 502 : status },
    );
  }
}
