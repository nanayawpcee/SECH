"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Newspaper, Search, X } from "lucide-react";
import { formatNewsDate, NEWS_CATEGORIES, type NewsCategory, type NewsItem } from "@/lib/news";
import { CATEGORY_ICONS, CategoryChip, NewsCard, NewsImage } from "@/components/news/NewsCard";

const PAGE = 9;

export function NewsBrowser({ items }: { items: NewsItem[] }) {
  const [category, setCategory] = useState<NewsCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const q = useDeferredValue(query.trim().toLowerCase());

  // Only offer the categories that actually have stories.
  const counts = useMemo(() => {
    const c = new Map<NewsCategory, number>();
    for (const i of items) c.set(i.category, (c.get(i.category) ?? 0) + 1);
    return c;
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === "All" || i.category === category) &&
          (!q || i.title.toLowerCase().includes(q) || i.excerpt.toLowerCase().includes(q)),
      ),
    [items, category, q],
  );

  // The newest story leads the page, until the visitor starts narrowing things down.
  const browsing = category === "All" && !q;
  const lead = browsing ? filtered[0] : undefined;
  const rest = lead ? filtered.slice(1) : filtered;
  const visible = rest.slice(0, shown);

  const pick = (c: NewsCategory | "All") => {
    setCategory(c);
    setShown(PAGE);
  };

  if (!items.length) {
    return (
      <div className="nw-empty">
        <Newspaper size={34} strokeWidth={1.5} aria-hidden="true" />
        <strong>No stories yet</strong>
        <span>News and announcements from the hospital will appear here.</span>
      </div>
    );
  }

  return (
    <>
      {lead && (
        <Link href={`/news/${lead.slug}`} className="nw-lead">
          <div className="nw-lead-media">
            <NewsImage item={lead} sizes="(max-width: 900px) 100vw, 640px" priority />
          </div>
          <div className="nw-lead-body">
            <div className="nw-lead-meta">
              <span className="nw-latest">Latest</span>
              <CategoryChip category={lead.category} />
            </div>
            <h2 className="nw-lead-title">{lead.title}</h2>
            {lead.excerpt && <p className="nw-lead-excerpt">{lead.excerpt}</p>}
            <div className="nw-lead-foot">
              <time className="nw-date" dateTime={lead.date}>{formatNewsDate(lead.date)}</time>
              <span className="nw-more">
                Read the full story <ArrowRight size={16} aria-hidden="true" />
              </span>
            </div>
          </div>
        </Link>
      )}

      <div className="nw-toolbar">
        <div className="nw-filters" role="group" aria-label="Filter by category">
          <button type="button" className="nw-filter" aria-pressed={category === "All"} onClick={() => pick("All")}>
            All <span className="nw-count">{items.length}</span>
          </button>
          {NEWS_CATEGORIES.filter((c) => counts.has(c)).map((c) => {
            const Icon = CATEGORY_ICONS[c];
            return (
              <button key={c} type="button" className="nw-filter" aria-pressed={category === c} onClick={() => pick(c)}>
                <Icon size={15} aria-hidden="true" />
                {c} <span className="nw-count">{counts.get(c)}</span>
              </button>
            );
          })}
        </div>
        <label className="nw-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search stories"
            aria-label="Search stories"
          />
          {query && (
            <button type="button" className="nw-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </label>
      </div>

      {!browsing && (
        <p className="nw-results" aria-live="polite">
          {filtered.length === 0
            ? "No stories match"
            : `${filtered.length} ${filtered.length === 1 ? "story" : "stories"}`}
          {category !== "All" && <> in <strong>{category}</strong></>}
          {q && <> for “{query.trim()}”</>}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="nw-empty">
          <Search size={30} strokeWidth={1.5} aria-hidden="true" />
          <strong>Nothing found</strong>
          <span>Try another word, or look through all stories.</span>
          <button
            type="button"
            className="nw-btn"
            onClick={() => {
              setQuery("");
              pick("All");
            }}
          >
            Show all stories
          </button>
        </div>
      ) : (
        <div className="nw-grid">
          {visible.map((item) => (
            <NewsCard key={item.slug} item={item} />
          ))}
        </div>
      )}

      {rest.length > shown && (
        <div className="nw-loadmore">
          <button type="button" className="nw-btn" onClick={() => setShown((n) => n + PAGE)}>
            Show more stories
            <span className="nw-count">{rest.length - shown}</span>
          </button>
        </div>
      )}
    </>
  );
}
