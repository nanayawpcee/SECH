import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { WP_BASE_URL, getAdminToken } from "@/lib/wp-graphql";
import { toPlainText, toPlainName } from "@/lib/wp-comments";

export const dynamic = "force-dynamic";

// thumbnails are optional, failures here are ignored
async function fetchMedia(
  ids: number[],
  adminToken: string,
): Promise<Map<number, string>> {
  const byId = new Map<number, string>();
  if (ids.length === 0) return byId;

  try {
    const response = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/media?include=${ids.join(",")}` +
        `&per_page=${ids.length}&_fields=id,source_url,media_details`,
      { headers: { Authorization: `Bearer ${adminToken}` }, cache: "no-store" },
    );
    if (!response.ok) return byId;

    const media = (await response.json()) as Array<Record<string, any>>;
    for (const item of media) {
      const sizes = item.media_details?.sizes ?? {};
      const url =
        sizes.medium?.source_url ??
        sizes.thumbnail?.source_url ??
        item.source_url;
      if (url) byId.set(Number(item.id), String(url));
    }
  } catch {
  }
  return byId;
}

export async function GET() {
  const gate = await requirePerm("comments");
  if (gate instanceof NextResponse) return gate;
  const adminToken = await getAdminToken();
  if (!adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/comments?status=hold&per_page=50&orderby=date&order=desc&_embed=up`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `WordPress returned ${response.status}.` },
        { status: response.status === 401 ? 401 : 502 },
      );
    }

    const raw = (await response.json()) as Array<Record<string, any>>;
    const total = Number(response.headers.get("X-WP-Total")) || raw.length;

    const mediaIds = Array.from(
      new Set(
        raw
          .map((c) => Number(c._embedded?.up?.[0]?.featured_media ?? 0))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );
    const mediaById = await fetchMedia(mediaIds, adminToken);

    // sanitise before it reaches the console, moderators are signed in
    const comments = raw.map((c) => {
      const parent = c._embedded?.up?.[0] ?? {};
      return {
        id: Number(c.id),
        postId: Number(c.post),
        author: toPlainName(String(c.author_name ?? "")) || "Anonymous",
        email: toPlainName(String(c.author_email ?? "")),
        content: toPlainText(String(c.content?.rendered ?? "")),
        date: String(c.date ?? ""),
        postTitle:
          toPlainName(String(parent.title?.rendered ?? ""), 120) || "Unknown post",
        postSlug: String(parent.slug ?? ""),
        postExcerpt: toPlainText(String(parent.excerpt?.rendered ?? ""), 320),
        postDate: String(parent.date ?? ""),
        postImage: mediaById.get(Number(parent.featured_media ?? 0)) ?? "",
      };
    });

    return NextResponse.json({ comments, total });
  } catch (error) {
    console.error("[wp] Could not load the moderation queue:", error);
    return NextResponse.json(
      { error: "Could not reach WordPress." },
      { status: 502 },
    );
  }
}
