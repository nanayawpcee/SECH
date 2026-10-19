import "server-only";
import { wpQuery } from "@/lib/wp-graphql";
import { decodeEntities, stripHtml } from "@/lib/wp-posts";
import { categoryFor, type ArticlePhoto, type NewsArticle, type NewsItem } from "@/lib/news";

interface WpNode {
  databaseId?: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  date: string;
  featuredImage?: {
    node?: { databaseId?: number; sourceUrl?: string; altText?: string; mediaDetails?: { width?: number; height?: number } | null } | null;
  } | null;
  categories?: { nodes?: Array<{ name: string }> } | null;
}

const LIST_FIELDS = `
  databaseId
  slug
  title
  excerpt
  date
  featuredImage { node { databaseId sourceUrl altText mediaDetails { width height } } }
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

const PHOTO_FIELDS = "databaseId sourceUrl width height altText caption";

type ArticleNode = WpNode & {
  content?: string;
  commentStatus?: string;
  galleryImages?: WpPhoto[] | null;
  contentImages?: WpPhoto[] | null;
};

/**
 * One story, with every photo for its slider, in a single request: the
 * WordPress host rate-limits bursts, so fewer requests per page matters.
 *
 * - The story doesn't exist: returns null (the page shows "not found").
 * - WordPress is unreachable: throws, so Next serves an error now and keeps
 *   any good cached copy, instead of caching a "not found" for a real story.
 * - WordPress lacks plugin 1.9.0 (no gallery fields): retries without them.
 */
export async function getNewsArticle(slug: string): Promise<NewsArticle | null> {
  const ask = (withPhotos: boolean) =>
    wpQuery<{ postBy: ArticleNode | null }>(
      `query NewsArticle($slug: String!) {
        postBy(slug: $slug) {
          ${LIST_FIELDS} content commentStatus
          ${withPhotos ? `galleryImages { ${PHOTO_FIELDS} } contentImages { ${PHOTO_FIELDS} }` : ""}
        }
      }`,
      { slug },
    );
  const data = (await ask(true)) ?? (await ask(false));
  if (!data) throw new Error(`WordPress could not be reached for the story "${slug}".`);
  const node = data.postBy;
  if (!node) return null;
  const words = stripHtml(node.content).split(" ").filter(Boolean).length;
  const item = toNewsItem(node);
  return {
    ...item,
    content: node.content ?? "",
    commentsOpen: node.commentStatus !== "closed",
    readMinutes: Math.max(1, Math.round(words / 200)),
    photos: articlePhotos(node, item.title),
  };
}

interface WpPhoto {
  databaseId: number;
  sourceUrl: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
}

/**
 * The slider's photos: the featured image first, then the post's gallery,
 * or for older posts without one, the photos embedded in their text.
 */
function articlePhotos(node: ArticleNode, title: string): ArticlePhoto[] {
  const featured = node.featuredImage?.node;
  const photos: (ArticlePhoto & { id?: number })[] = [];
  if (featured?.sourceUrl) {
    photos.push({
      id: featured.databaseId,
      src: featured.sourceUrl,
      alt: decodeEntities(featured.altText ?? "") || title,
      width: featured.mediaDetails?.width || 1600,
      height: featured.mediaDetails?.height || 1000,
      caption: null,
    });
  }
  const gallery = node.galleryImages ?? [];
  const extra = gallery.length ? gallery : node.contentImages ?? [];

  for (const p of extra) {
    if (!p.sourceUrl || photos.some((x) => x.id === p.databaseId || x.src === p.sourceUrl)) continue;
    photos.push({
      id: p.databaseId,
      src: p.sourceUrl,
      // Old uploads often carry the camera file name as alt text; don't read that out.
      alt: /^(IMG|DSC|PXL|WA)[-_ ]?\d/i.test(p.altText ?? "") || !p.altText ? `Photo from ${title}` : decodeEntities(p.altText),
      width: p.width || 1600,
      height: p.height || 1000,
      caption: p.caption ? decodeEntities(p.caption) : null,
    });
  }
  return photos.map((p) => ({ src: p.src, alt: p.alt, width: p.width, height: p.height, caption: p.caption }));
}
