import "server-only";
import { wpQuery } from "@/lib/wp-graphql";
import { decodeEntities, stripHtml } from "@/lib/wp-posts";
import { categoryFor, type NewsArticle, type NewsItem } from "@/lib/news";

interface WpNode {
  slug: string;
  title: string;
  excerpt?: string | null;
  date: string;
  featuredImage?: {
    node?: { sourceUrl?: string; altText?: string; mediaDetails?: { width?: number; height?: number } | null } | null;
  } | null;
  categories?: { nodes?: Array<{ name: string }> } | null;
}

const LIST_FIELDS = `
  slug
  title
  excerpt
  date
  featuredImage { node { sourceUrl altText mediaDetails { width height } } }
  categories { nodes { name } }
`;

function toNewsItem(node: WpNode): NewsItem {
  const title = stripHtml(node.title);
  const img = node.featuredImage?.node;
  return {
    slug: node.slug,
    title,
    // WordPress appends "[&hellip;]" to generated excerpts; the card clamps anyway.
    excerpt: stripHtml(node.excerpt).replace(/\s*\[…\]\s*$/, "…"),
    date: node.date,
    category: categoryFor((node.categories?.nodes ?? []).map((c) => c.name)),
    image: img?.sourceUrl
      ? {
          src: img.sourceUrl,
          alt: decodeEntities(img.altText ?? "") || title,
          width: img.mediaDetails?.width || 1600,
          height: img.mediaDetails?.height || 1000,
        }
      : null,
  };
}

/** Newest published stories. Returns [] when WordPress is unreachable. */
export async function getNewsItems(limit = 60): Promise<NewsItem[]> {
  const data = await wpQuery<{ posts: { nodes: WpNode[] } }>(
    `query NewsList($first: Int!) {
      posts(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes { ${LIST_FIELDS} }
      }
    }`,
    { first: limit },
  );
  return (data?.posts?.nodes ?? []).map(toNewsItem);
}

export async function getNewsArticle(slug: string): Promise<NewsArticle | null> {
  const data = await wpQuery<{ postBy: (WpNode & { content?: string; commentStatus?: string }) | null }>(
    `query NewsArticle($slug: String!) {
      postBy(slug: $slug) { ${LIST_FIELDS} content commentStatus }
    }`,
    { slug },
  );
  const node = data?.postBy;
  if (!node) return null;
  const words = stripHtml(node.content).split(" ").filter(Boolean).length;
  return {
    ...toNewsItem(node),
    content: node.content ?? "",
    commentsOpen: node.commentStatus !== "closed",
    readMinutes: Math.max(1, Math.round(words / 200)),
  };
}
