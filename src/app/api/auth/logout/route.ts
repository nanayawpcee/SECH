import { NextResponse } from "next/server";
import { ADMIN_COOKIE, wpGraphQL } from "@/lib/wp-graphql";

export async function POST() {
  // close the reveal-PIN window first, so the next sign-in asks for the PIN again.
  // Best effort: a sign-out never waits long or fails because of it.
  try {
    await Promise.race([
      wpGraphQL(`mutation LockReveal { lockReveal(input: {}) { ok } }`, {}, { authenticated: true }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    // signed out already, or WordPress is on an older plugin
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("admin_token", "", { ...ADMIN_COOKIE, maxAge: 0 });
  response.cookies.set("admin_refresh", "", { ...ADMIN_COOKIE, maxAge: 0 });

  return response;
}
