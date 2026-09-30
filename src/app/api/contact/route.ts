import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { SITE } from "@/lib/data";
import { createRateLimiter } from "@/lib/rate-limit";
import { wpGraphQL, toErrorResponse, WpGraphQLError } from "@/lib/wp-graphql";
import { isPlausibleEmail } from "@/lib/wp-newsletter";
import {
  MESSAGES_QUERY,
  MESSAGE_MAX,
  MESSAGE_TOPICS,
  SUBMIT_MESSAGE,
  isMissingMessagesPlugin,
  type ContactMessage,
} from "@/lib/wp-messages";

export const dynamic = "force-dynamic";

/** The inbox — administrators only, never cached. */
export async function GET() {
  const gate = await requirePerm("messages");
  if (gate instanceof NextResponse) return gate;
  try {
    const data = await wpGraphQL<{ contactMessages: ContactMessage[] | null }>(MESSAGES_QUERY, {}, { authenticated: true });
    return NextResponse.json({ messages: data.contactMessages ?? [] });
  } catch (error) {
    if (error instanceof WpGraphQLError && isMissingMessagesPlugin(error.message)) {
      return NextResponse.json({ messages: [], needsPlugin: true });
    }
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const rateLimited = createRateLimiter({ max: 4, windowMs: 10 * 60_000 });
const UNAVAILABLE = `We couldn’t send your message just now. Please call the hospital instead.`;

/**
 * Public: the contact form. Unauthenticated by necessity, so like bookings it
 * is gated on the shared key that only this server holds.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Please fill in the form." }, { status: 400 });

  // Honeypot: a field people never see. Bots fill it; pretend it worked.
  if (String(body.website ?? "").trim()) return NextResponse.json({ ok: true, reference: null });

  const name = String(body.name ?? "").trim().slice(0, 80);
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim().slice(0, 30);
  const message = String(body.message ?? "").trim();
  const topic = MESSAGE_TOPICS.some((t) => t.value === body.topic) ? String(body.topic) : "general";

  if (!name) return NextResponse.json({ error: "Please tell us your name." }, { status: 400 });
  if (email && !isPlausibleEmail(email)) return NextResponse.json({ error: "Please check your email address." }, { status: 400 });
  if (!email && !phone) {
    return NextResponse.json({ error: "Please give an email address or phone number so we can reply." }, { status: 400 });
  }
  if (message.length < 5) return NextResponse.json({ error: "Please write your message." }, { status: 400 });
  if (message.length > MESSAGE_MAX) {
    return NextResponse.json(
      { error: `Please keep your message under ${MESSAGE_MAX} characters. For longer enquiries, email ${SITE.email}.` },
      { status: 400 },
    );
  }

  if (rateLimited(request)) {
    return NextResponse.json({ error: "You’ve sent several messages already. Please wait a few minutes, or call us." }, { status: 429 });
  }

  const key = process.env.SECH_BOOKING_KEY;
  if (!key) {
    console.error("SECH_BOOKING_KEY is not set, so contact messages cannot be saved.");
    return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
  }

  try {
    const data = await wpGraphQL<{ submitContactMessage: { reference: string } }>(
      SUBMIT_MESSAGE,
      { name, email: email || null, phone: phone || null, topic, message },
      { headers: { "X-SECH-BOOKING-KEY": key } },
    );
    return NextResponse.json({ ok: true, reference: data.submitContactMessage.reference });
  } catch (error) {
    const { body: err, status } = toErrorResponse(error);
    if (error instanceof WpGraphQLError && isMissingMessagesPlugin(error.message)) {
      console.error("Contact message failed: WordPress needs sech-portal 1.5.0.");
    }
    // The plugin's validation messages are written for the public; nothing else is.
    const friendly = status === 400 && /^Please |too many messages/i.test(err.error);
    return NextResponse.json({ error: friendly ? err.error : UNAVAILABLE }, { status: friendly ? 400 : 502 });
  }
}
