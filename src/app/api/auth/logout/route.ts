import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/wp-graphql";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("admin_token", "", { ...ADMIN_COOKIE, maxAge: 0 });
  response.cookies.set("admin_refresh", "", { ...ADMIN_COOKIE, maxAge: 0 });

  return response;
}
