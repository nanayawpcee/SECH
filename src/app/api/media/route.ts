import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { WP_BASE_URL } from "@/lib/wp-graphql";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value;

    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const fileItem = formData.get("file") as File;

    if (!fileItem) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Build the Multi-Part Request directly to WordPress REST endpoint
    const wpFormData = new FormData();
    wpFormData.append("file", fileItem, fileItem.name);

    const wpResponse = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
      },
      body: wpFormData,
    });

    const mediaResult = await wpResponse.json();

    if (!wpResponse.ok) {
      return NextResponse.json({ error: mediaResult.message || "WP Rejected media upload" }, { status: wpResponse.status });
    }

    // Return numerical ID directly back to frontend layout loop
    return NextResponse.json({ id: mediaResult.id, url: mediaResult.source_url });
  } catch (error) {
    return NextResponse.json({ error: "Media routing thread execution failed" }, { status: 500 });
  }
}