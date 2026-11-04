import { NextResponse } from "next/server";
import { WP_ENDPOINT, ADMIN_COOKIE, SESSION_SECONDS } from "@/lib/wp-graphql";
import { viewerForToken } from "@/lib/access";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    const wpResponse = await fetch(WP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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