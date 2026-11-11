import "server-only";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
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

/** latest stories plus the one chosen to lead (it may be older than the latest few) */
/**
 * WordPress didn't answer (a 508 from the host, a timeout). While `next build`
 * runs, the page is built without it so one bad moment can't fail a deploy, and
 * the 60-second refresh fills it in. After that, throwing makes Next discard the
 * refresh and keep serving the last good page, then try again on a later visit,
 * so visitors never see the news vanish.
 */
function orKeepLastGood<T>(data: T | null, what: string): T | null {
  if (data === null && process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
    throw new Error(`WordPress could not be reached for ${what}; keeping the last good page.`);
  }
  return data;
}

export async function getHomeNews(limit = 3): Promise<{ posts: NewsItem[]; featured: NewsItem | null }> {
  const ask = (withFeatured: boolean) =>
    wpQuery<{ posts: { nodes: WpNode[] }; featuredPostId?: number | null }>(
      `query HomeNews($first: Int!) {
        ${withFeatured ? "featuredPostId" : ""}
        posts(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
          nodes { ${LIST_FIELDS} }
        }
      }`,
      { first: limit },
    );
  const data = orKeepLastGood((await ask(true)) ?? (await ask(false)), "the homepage news");
  const nodes = data?.posts?.nodes ?? [];
  const posts = nodes.map(toNewsItem);
  const featuredId = data?.featuredPostId ?? null;
  if (!featuredId) return { posts, featured: null };
  const inList = nodes.find((n) => n.databaseId === featuredId);
  if (inList) return { posts, featured: { ...toNewsItem(inList), featured: true } };
  const one = orKeepLastGood(
    await wpQuery<{ post: WpNode | null }>(
      `query FeaturedPost($id: ID!) { post(id: $id, idType: DATABASE_ID) { ${LIST_FIELDS} } }`,
      { id: String(featuredId) },
    ),
    "the featured story",
  );
  return { posts, featured: one?.post ? { ...toNewsItem(one.post), featured: true } : null };
}

export async function getNewsItems(limit = 60): Promise<NewsItem[]> {
  const ask = (withFeatured: boolean) =>
    wpQuery<{ posts: { nodes: WpNode[] }; featuredPostId?: number | null }>(
      `query NewsList($first: Int!) {
        ${withFeatured ? "featuredPostId" : ""}
        posts(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
          nodes { ${LIST_FIELDS} }
        }
      }`,
      { first: limit },
    );
  // plugin older than 1.13.0 doesn't know featuredPostId
  const data = orKeepLastGood((await ask(true)) ?? (await ask(false)), "the news list");
  const featured = data?.featuredPostId ?? null;
  return (data?.posts?.nodes ?? []).map((n) => ({ ...toNewsItem(n), featured: !!featured && n.databaseId === featured }));
}

const PHOTO_FIELDS = "databaseId sourceUrl width height altText caption";

type ArticleNode = WpNode & {
  content?: string;
  commentStatus?: string;
  galleryImages?: WpPhoto[] | null;
  contentImages?: WpPhoto[] | null;
};

// one request per story, the WP host rate-limits bursts (508s)
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

// featured image first, then the gallery (or images from the post body on older posts)
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
      // camera file names make useless alt text
      alt: /^(IMG|DSC|PXL|WA)[-_ ]?\d/i.test(p.altText ?? "") || !p.altText ? `Photo from ${title}` : decodeEntities(p.altText),
      width: p.width || 1600,
      height: p.height || 1000,
      caption: p.caption ? decodeEntities(p.caption) : null,
    });
  }
  return photos.map((p) => ({ src: p.src, alt: p.alt, width: p.width, height: p.height, caption: p.caption }));
}
