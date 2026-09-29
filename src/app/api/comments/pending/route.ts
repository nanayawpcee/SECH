import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { WP_BASE_URL, getAdminToken } from "@/lib/wp-graphql";
import { toPlainText, toPlainName } from "@/lib/wp-comments";

export const dynamic = "force-dynamic";

/**
 * Featured-image URLs for a set of attachment ids, in one request.
 *
 * Best-effort by design: a thumbnail is decoration on a moderation screen, so a
 * failure here returns an empty map and the queue still renders.
 */
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
      // Prefer a resized copy: the queue may show a dozen of these, and the
      // full-size upload from a phone camera can be several megabytes.
      const sizes = item.media_details?.sizes ?? {};
      const url =
        sizes.medium?.source_url ??
        sizes.thumbnail?.source_url ??
        item.source_url;
      if (url) byId.set(Number(item.id), String(url));
    }
  } catch {
    // Swallowed on purpose — see the doc comment.
  }
  return byId;
}

/**
 * The moderation queue: comments awaiting approval.
 *
 * Staff-only — gated on the same httpOnly admin cookie as the rest of the
 * console. Goes through WordPress's REST API rather than WPGraphQL because
 * comment status values are documented there ("hold" / "approved"), whereas
 * WPGraphQL's equivalent field accepts any string and silently does nothing
 * with the wrong one.
 */
export async function GET() {
  const gate = await requirePerm("comments");
  if (gate instanceof NextResponse) return gate;
  const adminToken = await getAdminToken();
  if (!adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // `_embed=up` pulls the parent post in with each comment, so a moderator
    // can see what is being commented on without a request per row.
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
    // The page is capped at 50; WordPress reports the real size of the queue
    // in a header, so the console can say "50 of 212" rather than "50".
    const total = Number(response.headers.get("X-WP-Total")) || raw.length;

    // The embedded parent carries only a media *id*, so resolve the thumbnails
    // in one extra call for the whole queue rather than one per comment.
    const mediaIds = Array.from(
      new Set(
        raw
          .map((c) => Number(c._embedded?.up?.[0]?.featured_media ?? 0))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    );
    const mediaById = await fetchMedia(mediaIds, adminToken);

    // Sanitised before it reaches the console: a moderator is a logged-in user,
    // and an unsanitised comment rendered in an admin page is the classic way
    // to escalate a stored payload into an account takeover.
    const comments = raw.map((c) => {
      const parent = c._embedded?.up?.[0] ?? {};
      return {
        id: Number(c.id),
        postId: Number(c.post),
        author: toPlainName(String(c.author_name ?? "")) || "Anonymous",
        email: toPlainName(String(c.author_email ?? "")),
        content: toPlainText(String(c.content?.rendered ?? "")),
        date: String(c.date ?? ""),
        // Post titles come from WordPress and can carry entities or markup,
        // so they go through the same stripper as the comment body.
        postTitle:
          toPlainName(String(parent.title?.rendered ?? ""), 120) || "Unknown post",
        // The public article, not the WordPress permalink — a moderator wants
        // to see the page a reader sees.
        postSlug: String(parent.slug ?? ""),
        // Enough of the post to judge a comment against it without leaving the
        // queue. The excerpt is stripped like everything else — WordPress wraps
        // it in <p> and appends a "[…]" link.
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
