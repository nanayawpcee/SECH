import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, HeartPulse, Megaphone, Newspaper, PenLine, type LucideIcon } from "lucide-react";
import { formatNewsDate, type NewsCategory, type NewsItem } from "@/lib/news";

export const CATEGORY_ICONS: Record<NewsCategory, LucideIcon> = {
  News: Newspaper,
  Announcements: Megaphone,
  Events: CalendarDays,
  "Health & Education": HeartPulse,
  Blog: PenLine,
};

export function CategoryChip({ category, onImage = false }: { category: NewsCategory; onImage?: boolean }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span className="nw-chip" data-cat={category} data-on-image={onImage || undefined}>
      <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      {category}
    </span>
  );
}

/** Photo, or a branded panel for the rare story without one. */
export function NewsImage({ item, sizes, priority = false }: { item: NewsItem; sizes: string; priority?: boolean }) {
  if (!item.image) {
    const Icon = CATEGORY_ICONS[item.category];
    return (
      <div className="nw-img-fallback" aria-hidden="true">
        <Icon size={40} strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <Image
      src={item.image.src}
      alt={item.image.alt}
      fill
      sizes={sizes}
      priority={priority}
      className="nw-img"
    />
  );
}

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link href={`/news/${item.slug}`} className="nw-card">
      <div className="nw-card-media">
        <NewsImage item={item} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 380px" />
        <CategoryChip category={item.category} onImage />
      </div>
      <div className="nw-card-body">
        <time className="nw-date" dateTime={item.date}>{formatNewsDate(item.date)}</time>
        <h3 className="nw-card-title">{item.title}</h3>
        {item.excerpt && <p className="nw-card-excerpt">{item.excerpt}</p>}
        <span className="nw-more">
          Read story <ArrowRight size={15} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
