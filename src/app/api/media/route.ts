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
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const wpFormData = new FormData();
    wpFormData.append("file", fileItem, fileItem.name);

    const wpResponse = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
      },
      body: wpFormData,
    });

    // WordPress or the host can answer with an HTML page (e.g. a size limit); report that plainly
    const replyText = await wpResponse.text();
    let mediaResult: { id?: number; source_url?: string; message?: string };
    try {
      mediaResult = JSON.parse(replyText);
    } catch {
      const tooBig = wpResponse.status === 413 || /too large|exceeds|upload_max_filesize|post_max_size/i.test(replyText);
      return NextResponse.json(
        { error: tooBig ? "The photo is bigger than the WordPress hosting allows. Please use a smaller one." : `WordPress gave an unexpected reply (${wpResponse.status}). Please try again.` },
        { status: tooBig ? 413 : 502 },
      );
    }

    if (!wpResponse.ok) {
      const raw = String(mediaResult.message || "");
      if (/upload_max_filesize|post_max_size|exceeds the maximum upload size/i.test(raw)) {
        return NextResponse.json(
          {
            error:
              "This file is bigger than the WordPress hosting allows. Use a smaller file, or raise the upload limit in cPanel (upload_max_filesize and post_max_size).",
          },
          { status: 413 },
        );
      }
      return NextResponse.json({ error: raw || "WordPress rejected the upload." }, { status: wpResponse.status });
    }

    return NextResponse.json({ id: mediaResult.id, url: mediaResult.source_url });
  } catch (error) {
    return NextResponse.json({ error: "The photo couldn’t be sent to WordPress. Check the connection and try again." }, { status: 500 });
  }
}