import { NextResponse } from "next/server";
import { wpQuery, wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import {
  APPROVED_COMMENTS_QUERY,
  CREATE_COMMENT_MUTATION,
  mapComment,
  toPlainText,
  toPlainName,
  looksLikeEmail,
  type PublicComment,
} from "@/lib/wp-comments";

export const dynamic = "force-dynamic";

/**
 * Public comments. The browser talks to this route, never to WordPress — the
 * shared secret stays on the server, exactly as the booking endpoint works.
 */

const MAX_COMMENT = 2000;
const MIN_COMMENT = 2;

/**
 * Per-IP throttle. In-memory, so on serverless it is per-instance and resets on
 * cold start — a speed bump against casual flooding, not a guarantee. The real
 * defences are the moderation queue (nothing publishes unreviewed) and Akismet.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    hits.forEach((times: number[], key: string) => {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    });
  }
  return false;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? "unknown").trim();
}

/** Approved comments for one post. Nothing pending is ever exposed. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "A post slug is required." }, { status: 400 });
  }

  const data = await wpQuery<{
    post: {
      databaseId: number;
      commentCount: number | null;
      comments: { nodes: Parameters<typeof mapComment>[0][] };
    } | null;
  }>(APPROVED_COMMENTS_QUERY, { slug }, 30);

  if (!data?.post) {
    // The CMS is unreachable or the post does not exist. Either way the page
    // should render without comments rather than show an error.
    return NextResponse.json({ comments: [] as PublicComment[], postId: null });
  }

  return NextResponse.json({
    postId: data.post.databaseId,
    comments: (data.post.comments?.nodes ?? []).map(mapComment),
  });
}

export async function POST(request: Request) {
  try {
    const key = process.env.SECH_BOOKING_KEY;
    if (!key) {
      console.error("SECH_BOOKING_KEY is not set — comments cannot be submitted.");
      return NextResponse.json(
        { error: "Comments are temporarily unavailable." },
        { status: 503 },
      );
    }

    const body = await request.json();

    // Honeypot: a field hidden from people, irresistible to form-filling bots.
    // Answer 200 so the bot believes it succeeded and does not retry.
    if (String(body.website ?? "").trim() !== "") {
      return NextResponse.json({ success: true, pending: true });
    }

    if (rateLimited(clientIp(request))) {
      return NextResponse.json(
        { error: "You have posted a few comments already. Please try again later." },
        { status: 429 },
      );
    }

    const postId = Number(body.postId);
    // Strip to plain text on the way IN, so nothing dangerous is ever stored —
    // staff open this queue inside wp-admin.
    const author = toPlainName(String(body.author ?? ""));
    const email = String(body.email ?? "").trim().toLowerCase();
    const content = toPlainText(String(body.content ?? ""), MAX_COMMENT);

    if (!Number.isInteger(postId) || postId <= 0) {
      return NextResponse.json({ error: "Unknown post." }, { status: 400 });
    }
    if (author.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!looksLikeEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address. It is not published." },
        { status: 400 },
      );
    }
    if (content.length < MIN_COMMENT) {
      return NextResponse.json({ error: "Please write a comment." }, { status: 400 });
    }

    await wpGraphQL<{ createComment: { success: boolean } }>(
      CREATE_COMMENT_MUTATION,
      { commentOn: postId, author, authorEmail: email, content },
      { headers: { "X-SECH-BOOKING-KEY": key } },
    );

    // Always "pending": WordPress holds it for approval, and saying so plainly
    // stops people re-submitting when their comment does not appear.
    return NextResponse.json({ success: true, pending: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(
      {
        error:
          status >= 500
            ? "We could not post your comment. Please try again later."
            : body.error,
      },
      { status },
    );
  }
}
