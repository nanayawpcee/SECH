import { NextResponse } from "next/server";
import { WP_ENDPOINT } from "@/lib/wp-graphql";
import { createRateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// WordPress also counts attempts per visitor; this keeps obvious floods off it
const rateLimited = createRateLimiter({ max: 30, windowMs: 15 * 60_000 });

const REQUEST = `mutation ($login: String!) { sechRequestPasswordReset(input: { login: $login }) { ok } }`;
const CHECK = `mutation ($key: String!, $login: String!) {
  sechCheckPasswordResetKey(input: { key: $key, login: $login }) { firstName username }
}`;
const RESET = `mutation ($key: String!, $login: String!, $password: String!) {
  sechResetPasswordWithKey(input: { key: $key, login: $login, password: $password }) { ok username }
}`;

const NOT_READY = "Password reset isn’t available right now. Please ask an administrator to reset your password.";

/** Calls WordPress as the portal (shared key) and passes the visitor's IP so it can count attempts per person. */
async function wp<T>(request: Request, query: string, variables: Record<string, string>) {
  const key = process.env.SECH_BOOKING_KEY;
  if (!key) return { error: NOT_READY, status: 503 };
  const clientIp = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  let payload: { data?: T; errors?: Array<{ message?: string }> } | null = null;
  try {
    const res = await fetch(WP_ENDPOINT, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-SECH-BOOKING-KEY": key,
        ...(clientIp ? { "X-SECH-CLIENT-IP": clientIp } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
    payload = await res.json().catch(() => null);
  } catch {
    payload = null;
  }
  if (!payload) return { error: "We couldn’t reach the server. Check your connection and try again.", status: 502 };
  if (payload.errors?.length) {
    const raw = payload.errors[0]?.message ?? "";
    // an older plugin without these mutations
    if (/Cannot query field|Unknown argument|Unknown type/i.test(raw)) return { error: NOT_READY, status: 503 };
    const message = raw.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim() || "Something went wrong. Please try again.";
    return { error: message, status: /too many/i.test(message) ? 429 : 400 };
  }
  return { data: payload.data as T };
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action;
  const noStore = { headers: { "Cache-Control": "no-store" } };

  if (action === "request") {
    const login = text(body.login, 100);
    if (!login) return NextResponse.json({ error: "Enter your username or email address." }, { status: 400 });
    const r = await wp<{ sechRequestPasswordReset: { ok: boolean } }>(request, REQUEST, { login });
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
    // the same answer whether or not the account exists
    return NextResponse.json({ ok: true }, noStore);
  }

  const key = text(body.key, 100);
  const login = text(body.login, 100);
  if (!key || !login) {
    return NextResponse.json({ error: "This link is incomplete. Ask for a new one below." }, { status: 400 });
  }

  if (action === "check") {
    const r = await wp<{ sechCheckPasswordResetKey: { firstName: string; username: string } }>(request, CHECK, { key, login });
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json(r.data!.sechCheckPasswordResetKey, noStore);
  }

  if (action === "reset") {
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 12) {
      return NextResponse.json({ error: "Use at least 12 characters for the new password." }, { status: 400 });
    }
    const r = await wp<{ sechResetPasswordWithKey: { ok: boolean; username: string } }>(request, RESET, { key, login, password });
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true, username: r.data!.sechResetPasswordWithKey.username }, noStore);
  }

  return NextResponse.json({ error: "Unknown request." }, { status: 400 });
}
