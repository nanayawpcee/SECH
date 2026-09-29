import "@/styles/news.css";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsItem } from "@/lib/news";

/** The homepage's "latest news" strip: the three newest stories. */
export function NewsSection({ posts = [] }: { posts: NewsItem[] }) {
  const displayed = posts.slice(0, 3);
  if (!displayed.length) return null;

  return (
    <section id="news" className="nw-home">
      <div className="nw-container">
        <AnimateIn>
          <div className="nw-home-head">
            <div>
              <div className="section-tag">
                <span>Latest Updates</span>
              </div>
              <h2 className="section-heading">News &amp; Announcements</h2>
            </div>
            <Link href="/news" className="nw-btn nw-btn--ghost">
              All stories <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </AnimateIn>

        <div className="nw-grid">
          {displayed.map((item, i) => (
            <AnimateIn key={item.slug} delay={i * 90} style={{ height: "100%" }}>
              <NewsCard item={item} />
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
