import { NextResponse } from "next/server";
import { WP_ENDPOINT } from "@/lib/wp-graphql";

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
              user {
                id
                name
                email
              }
            }
          }
        `,
        // WPGraphQL handles usernames or emails seamlessly inside the single 'username' variable field
        variables: { username: identifier, password: password },
      }),
    });

    const { data, errors } = await wpResponse.json();

    if (errors || !data?.login?.authToken) {
      let cleanError = errors?.[0]?.message || "Invalid credentials.";
      
      // Sanitizer to scrub out WordPress HTML tags from displaying in your frontend alert
      cleanError = cleanError
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;[^&]+&gt;/g, '')
        .replace(/&amp;/g, '&');

      return NextResponse.json({ error: cleanError }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user: data.login.user });

    // Store the auth token safely away from malicious XSS access 
    response.cookies.set("admin_token", data.login.authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}