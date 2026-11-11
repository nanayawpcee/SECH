import { NextResponse } from "next/server";
import { WP_ENDPOINT, ADMIN_COOKIE, SESSION_SECONDS } from "@/lib/wp-graphql";
import { viewerForToken } from "@/lib/access";
import { createRateLimiter } from "@/lib/rate-limit";

const rateLimited = createRateLimiter({ max: 10, windowMs: 15 * 60_000 });

export async function POST(request: Request) {
  if (rateLimited(request)) {
    return NextResponse.json({ error: "Too many sign-in attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }
  try {
    const { identifier, password } = await request.json();

    // with the shared key, WordPress counts failed attempts per visitor instead of per Vercel server
    const key = process.env.SECH_BOOKING_KEY;
    const clientIp = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const wpResponse = await fetch(WP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { "X-SECH-BOOKING-KEY": key } : {}),
        ...(key && clientIp ? { "X-SECH-CLIENT-IP": clientIp } : {}),
      },
      body: JSON.stringify({
        query: `
          mutation LoginUser($username: String!, $password: String!) {
            login(input: { username: $username, password: $password }) {
              authToken
              refreshToken
              user {
                id
                name
                email
              }
            }
          }
        `,
        variables: { username: identifier, password: password },
      }),
    });

    const { data, errors } = await wpResponse.json();

    if (errors || !data?.login?.authToken) {
      let cleanError = errors?.[0]?.message || "Invalid credentials.";
      
      cleanError = cleanError
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;[^&]+&gt;/g, '')
        .replace(/&amp;/g, '&');

      return NextResponse.json({ error: cleanError }, { status: 401 });
    }

    const viewer = await viewerForToken(data.login.authToken);
    const response = NextResponse.json({
      success: true,
      user: { ...data.login.user, databaseId: viewer?.id ?? null, roles: viewer?.roles ?? [] },
      perms: viewer?.perms ?? [],
      mustChangePassword: viewer?.mustChangePassword ?? false,
    });

    // both tokens live in httpOnly cookies. the session still ends after 2 hours
    response.cookies.set("admin_token", data.login.authToken, { ...ADMIN_COOKIE, maxAge: SESSION_SECONDS });
    if (data.login.refreshToken) {
      response.cookies.set("admin_refresh", data.login.refreshToken, { ...ADMIN_COOKIE, maxAge: SESSION_SECONDS });
    }

    return response;
  } catch (err) {
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}