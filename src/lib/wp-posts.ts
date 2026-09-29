import type { Post } from "@/app/admin/data";

/** Shape WPGraphQL returns for a post in the admin list. */
export interface WpPostNode {
  databaseId: number;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  slug: string | null;
  date: string | null;
  commentStatus?: string | null;
  status: string | null;
  author?: { node?: { name?: string | null; databaseId?: number | null } | null } | null;
  featuredImageDatabaseId?: number | null;
  featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
  categories?: { nodes?: Array<{ name?: string | null; slug?: string | null }> } | null;
}

export const POST_FIELDS = `
  databaseId
  commentStatus
  title
  excerpt
  content
  slug
  date
  status
  author { node { name databaseId } }
  featuredImageDatabaseId
  featuredImage { node { sourceUrl } }
  categories { nodes { name slug } }
`;

const KNOWN_TYPES: Post["type"][] = ["news", "blog", "event", "announcement"];

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">",
  hellip: "…", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

/**
 * WordPress sends titles and excerpts "texturized" — apostrophes arrive as
 * &#8217; and so on. The admin renders these as React text, which escapes
 * rather than interprets them, so they must be decoded to show as characters.
 * &amp; is decoded last so "&amp;lt;" becomes the text "&lt;", never "<".
 */
export function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/&amp;/g, "&");
}

export function stripHtml(value: string | null | undefined): string {
  return decodeEntities((value ?? "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/**
 * WordPress models post type as a category, so derive it from the assigned
 * categories and fall back to "news" when none of them match.
 */
function deriveType(node: WpPostNode): Post["type"] {
  const slugs = (node.categories?.nodes ?? [])
    .flatMap((c) => [c.slug, c.name])
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  return KNOWN_TYPES.find((t) => slugs.includes(t)) ?? "news";
}

/** WP statuses are publish/draft/future/pending/private. */
function deriveStatus(status: string | null): Post["status"] {
  if (status === "publish") return "published";
  if (status === "future") return "scheduled";
  if (status === "pending") return "pending";
  return "draft";
}

/** Post plus the featured-image fields the editor needs. */
export type AdminPost = Post & {
  featuredImageId: number | null;
  featuredImageUrl: string | null;
  /** False when the post's comments are closed in WordPress. */
  commentsOpen: boolean;
  /** WordPress user id of the author — ownership checks for staff writers. */
  authorId: number | null;
};

export function mapWpPost(node: WpPostNode): AdminPost {
  return {
    id: node.databaseId,
    title: stripHtml(node.title) || "(untitled)",
    excerpt: stripHtml(node.excerpt),
    body: node.content ?? "",
    type: deriveType(node),
    author: node.author?.node?.name ?? "Unknown",
    date: node.date
      ? new Date(node.date).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        })
      : "",
    status: deriveStatus(node.status),
    slug: node.slug ?? "",
    featuredImageId: node.featuredImageDatabaseId ?? null,
    featuredImageUrl: node.featuredImage?.node?.sourceUrl ?? null,
    commentsOpen: node.commentStatus !== "closed",
    authorId: node.author?.node?.databaseId ?? null,
  };
}

/** Our status vocabulary -> WPGraphQL's PostStatusEnum. */
export function toWpStatus(status: Post["status"]): "PUBLISH" | "DRAFT" | "FUTURE" | "PENDING" {
  if (status === "published") return "PUBLISH";
  if (status === "scheduled") return "FUTURE";
  if (status === "pending") return "PENDING";
  return "DRAFT";
}

/**
 * The status a person is actually allowed to set. Anyone without publishing
 * rights who asks to publish is submitting for review instead — the server
 * decides this, so a staff writer cannot publish by editing the request.
 */
export function allowedStatus(requested: Post["status"], canPublish: boolean): Post["status"] {
  if (canPublish) return requested;
  return requested === "published" || requested === "scheduled" ? "pending" : requested;
}

export const SET_FEATURED_IMAGE = `
  mutation SetFeaturedImage($postId: Int!, $mediaId: Int) {
    setPostFeaturedImage(input: { postId: $postId, mediaId: $mediaId }) {
      postId
      featuredImageId
      sourceUrl
    }
  }
`;
