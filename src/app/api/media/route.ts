import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { WP_BASE_URL, getAdminToken } from "@/lib/wp-graphql";

export async function POST(request: Request) {
  const gate = await requirePerm("media.upload");
  if (gate instanceof NextResponse) return gate;
  try {
    const adminToken = await getAdminToken();

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