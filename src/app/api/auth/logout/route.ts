import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/wp-graphql";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Same attributes as login, or the browser treats these as different
  // cookies and never clears the real ones.
  response.cookies.set("admin_token", "", { ...ADMIN_COOKIE, maxAge: 0 });
  response.cookies.set("admin_refresh", "", { ...ADMIN_COOKIE, maxAge: 0 });

  return response;
}
