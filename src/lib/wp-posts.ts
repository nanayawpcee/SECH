import type { Post } from "@/app/admin/data";

/** Shape WPGraphQL returns for a post in the admin list. */
export interface WpPostNode {
  databaseId: number;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  slug: string | null;
  date: string | null;
  status: string | null;
  author?: { node?: { name?: string | null } | null } | null;
  featuredImageDatabaseId?: number | null;
  featuredImage?: { node?: { sourceUrl?: string | null } | null } | null;
  categories?: { nodes?: Array<{ name?: string | null; slug?: string | null }> } | null;
}

export const POST_FIELDS = `
  databaseId
  title
  excerpt
  content
  slug
  date
  status
  author { node { name } }
  featuredImageDatabaseId
  featuredImage { node { sourceUrl } }
  categories { nodes { name slug } }
`;

const KNOWN_TYPES: Post["type"][] = ["news", "blog", "event", "announcement"];

function stripHtml(value: string | null | undefined): string {
  return (value ?? "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
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
  return "draft";
}

/** Post plus the featured-image fields the editor needs. */
export type AdminPost = Post & {
  featuredImageId: number | null;
  featuredImageUrl: string | null;
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
  };
}

/** Our status vocabulary -> WPGraphQL's PostStatusEnum. */
export function toWpStatus(status: Post["status"]): "PUBLISH" | "DRAFT" | "FUTURE" {
  if (status === "published") return "PUBLISH";
  if (status === "scheduled") return "FUTURE";
  return "DRAFT";
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
