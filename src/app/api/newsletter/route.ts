import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { createRateLimiter } from "@/lib/rate-limit";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import {
  SUBSCRIBERS_QUERY,
  SUBSCRIBE,
  isMissingNewsletterPlugin,
  isPlausibleEmail,
  type NewsletterSubscriber,
} from "@/lib/wp-newsletter";

export const dynamic = "force-dynamic";

/** The mailing list — administrators only, never cached. */
export async function GET() {
  const gate = await requirePerm("newsletter");
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ newsletterSubscribers: NewsletterSubscriber[] | null }>(
      SUBSCRIBERS_QUERY,
      {},
      { authenticated: true },
    );
    return NextResponse.json({ subscribers: data.newsletterSubscribers ?? [] });
  } catch (error) {
    if (error instanceof WpGraphQLError && isMissingNewsletterPlugin(error.message)) {
      return NextResponse.json({ subscribers: [], needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const rateLimited = createRateLimiter({ max: 5, windowMs: 10 * 60_000 });

const DONE = { ok: true, message: "Thank you, you’re on the list." };

/**
 * Public sign-up from the site footer. Unauthenticated by necessity, so like
 * bookings it is gated on the shared key that only this server holds.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
  }

  // Honeypot: a field people never see. Bots fill it; pretend it worked.
  if (String(body.website ?? "").trim()) return NextResponse.json(DONE);

  if (rateLimited(request)) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!isPlausibleEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json({ error: "Please tick the box to agree to receive our emails." }, { status: 400 });
  }

  const key = process.env.SECH_BOOKING_KEY;
  if (!key) {
    console.error("SECH_BOOKING_KEY is not set, so newsletter sign-ups cannot be saved.");
    return NextResponse.json({ error: "Sign-up is unavailable right now. Please try again later." }, { status: 503 });
  }

  try {
    await wpGraphQL(
      SUBSCRIBE,
      { email, name: String(body.name ?? "").trim().slice(0, 80) || null, source: "website-footer" },
      { headers: { "X-SECH-BOOKING-KEY": key } },
    );
    // The same reply whether or not the address was already on the list.
    return NextResponse.json(DONE);
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    if (error instanceof WpGraphQLError && isMissingNewsletterPlugin(error.message)) {
      console.error("Newsletter sign-up failed: WordPress needs sech-portal 1.4.0.");
    }
    // Validation messages are written for the public; anything else is not.
    const friendly = status === 400 && /valid email|Too many sign-ups/i.test(err.error);
    return NextResponse.json(
      { error: friendly ? err.error : "We couldn’t sign you up just now. Please try again later." },
      { status: friendly ? 400 : 502 },
    );
  }
}
