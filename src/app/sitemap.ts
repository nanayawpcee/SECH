import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";
import { wpQuery } from "@/lib/wp-graphql";

/** Served at /sitemap.xml. Lists every public page; the portals are left out. */

// Rebuilt hourly so new stories appear without a redeploy.
export const revalidate = 3600;

const PAGES: { path: string; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/services", changeFrequency: "monthly", priority: 0.9 },
  { path: "/appointment", changeFrequency: "yearly", priority: 0.9 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.8 },
  { path: "/news", changeFrequency: "daily", priority: 0.8 },
  { path: "/about", changeFrequency: "yearly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/organogram", changeFrequency: "yearly", priority: 0.4 },
  { path: "/disclaimer", changeFrequency: "yearly", priority: 0.2 },
];

async function newsEntries(): Promise<MetadataRoute.Sitemap> {
  const data = await wpQuery<{ posts: { nodes: { slug: string; date: string; modified?: string | null }[] } }>(
    `query SitemapPosts {
      posts(first: 500, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
        nodes { slug date modified }
      }
    }`,
    {},
    3600,
  );
  // WordPress unreachable: still serve the rest of the sitemap.
  return (data?.posts?.nodes ?? []).map((p) => ({
    url: absoluteUrl(`/news/${p.slug}`),
    lastModified: new Date(p.modified || p.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = PAGES.map((p) => ({ url: absoluteUrl(p.path), changeFrequency: p.changeFrequency, priority: p.priority }));
  const services = SERVICES.map((s) => ({
    url: absoluteUrl(`/services/${s.slug}`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [...pages, ...services, ...(await newsEntries())];
}
