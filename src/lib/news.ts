/**
 * Shared by the news pages' server and client components — no data fetching
 * here (see news-data.ts), so it is safe to import from the browser.
 */

/** A story as the public news pages show it — plain text, ready to render. */
export interface NewsItem {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: NewsCategory;
  image: { src: string; alt: string; width: number; height: number } | null;
}

export interface NewsArticle extends NewsItem {
  content: string;
  commentsOpen: boolean;
  readMinutes: number;
}

export type NewsCategory = "News" | "Announcements" | "Events" | "Health & Education" | "Blog";

/** Display order of the filter chips. */
export const NEWS_CATEGORIES: NewsCategory[] = ["News", "Announcements", "Events", "Health & Education", "Blog"];

/**
 * Posts carry years of inconsistent categories ("Event" and "Events",
 * "healthnews", "Headlines", or none at all). Fold them into the handful a
 * visitor can actually filter by; anything unrecognised is News.
 */
export function categoryFor(names: string[]): NewsCategory {
  const all = names.map((n) => n.toLowerCase().replace(/[^a-z]/g, ""));
  if (all.some((n) => n.startsWith("announcement"))) return "Announcements";
  if (all.some((n) => n === "event" || n === "events")) return "Events";
  if (all.some((n) => n === "education" || n === "healthnews" || n === "health")) return "Health & Education";
  if (all.includes("blog")) return "Blog";
  return "News";
}

export function formatNewsDate(iso: string, month: "long" | "short" = "long"): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month, year: "numeric" });
}
