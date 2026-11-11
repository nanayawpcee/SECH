export interface NewsItem {
  slug: string;
  /** chosen in the portal to lead the News page */
  featured?: boolean;
  title: string;
  excerpt: string;
  date: string;
  category: NewsCategory;
  image: { src: string; alt: string; width: number; height: number } | null;
}

export interface ArticlePhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string | null;
}

export interface NewsArticle extends NewsItem {
  content: string;
  commentsOpen: boolean;
  readMinutes: number;
  photos: ArticlePhoto[];
}

export type NewsCategory = "News" | "Announcements" | "Events" | "Health & Education" | "Blog";

export const NEWS_CATEGORIES: NewsCategory[] = ["News", "Announcements", "Events", "Health & Education", "Blog"];

// old posts have messy categories, map them onto the five filters
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
