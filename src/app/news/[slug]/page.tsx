import "@/styles/news.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import { ArrowLeft, CalendarDays, ChevronRight, Clock, Stethoscope } from "lucide-react";
import { BookButton } from "@/components/ui/BookButton";
import { CommentSection } from "@/components/ui/CommentSection";
import { ArticleShare } from "@/components/news/ArticleShare";
import { CategoryChip, NewsCard } from "@/components/news/NewsCard";
import { getNewsArticle, getNewsItems } from "@/lib/news-data";
import { formatNewsDate } from "@/lib/news";

interface Props {
  params: { slug: string };
}

// WP content is rendered raw via dangerouslySetInnerHTML below — strip
// scripts/event handlers/js: URIs before it ever reaches the client.
// img/figure/figcaption are dropped rather than allowed-then-hidden, since
// the featured image is already shown separately above the article body.
function sanitizeArticleContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr",
      "strong", "b", "em", "i", "u", "s", "sub", "sup",
      "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "blockquote", "a", "span",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

export async function generateStaticParams() {
  // An empty list is a valid answer: nothing is prerendered and each article is
  // rendered on first request instead. That keeps a CMS outage from failing the
  // build — which is what "Failed to collect page data for /news/[slug]" was.
  const posts = await getNewsItems(20);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getNewsArticle(params.slug);
  if (!article) return { title: "Article Not Found" };

  // What WhatsApp, Facebook and X show when a link to this story is shared.
  const images = article.image
    ? [{ url: article.image.src, width: article.image.width, height: article.image.height, alt: article.image.alt }]
    : undefined;
  return {
    title: article.title,
    description: article.excerpt,
    // A page's openGraph replaces the root one rather than merging, so the
    // site-wide fields are repeated here.
    openGraph: {
      type: "article",
      url: `/news/${article.slug}`,
      siteName: "SECH Ghana",
      locale: "en_GH",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.date,
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: article.title, description: article.excerpt },
  };
}

export default async function ArticlePage({ params }: Props) {
  const [article, recent] = await Promise.all([getNewsArticle(params.slug), getNewsItems(4)]);
  if (!article) notFound();

  const more = recent.filter((p) => p.slug !== article.slug).slice(0, 3);
  // A tall poster would fill the whole screen at full width; keep it framed.
  const portrait = article.image ? article.image.height > article.image.width : false;

  return (
    <>
      <header className="nw-article-hero">
        <div className="nw-container nw-article-hero-inner">
          <nav className="nw-crumbs" aria-label="Breadcrumb">
            <Link href="/news">News &amp; Announcements</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span>{article.category}</span>
          </nav>
          <CategoryChip category={article.category} onImage />
          <h1 className="nw-article-title">{article.title}</h1>
          {article.excerpt && <p className="nw-article-standfirst">{article.excerpt}</p>}
          <div className="nw-article-meta">
            <span><CalendarDays size={16} aria-hidden="true" /><time dateTime={article.date}>{formatNewsDate(article.date)}</time></span>
            <span><Clock size={16} aria-hidden="true" />{article.readMinutes} min read</span>
          </div>
        </div>
      </header>

      <div className="nw-container nw-article-wrap">
        {article.image && (
          <figure className="nw-article-figure" data-portrait={portrait || undefined}>
            <Image
              src={article.image.src}
              alt={article.image.alt}
              width={article.image.width}
              height={article.image.height}
              sizes="(max-width: 1180px) 100vw, 1100px"
              priority
            />
          </figure>
        )}

        <div className="nw-article-grid">
          <div className="nw-article-main">
            <div
              className="nw-prose"
              dangerouslySetInnerHTML={{ __html: sanitizeArticleContent(article.content) }}
            />

            <div className="nw-article-end">
              <ArticleShare title={article.title} />
              <Link href="/news" className="nw-btn nw-btn--ghost">
                <ArrowLeft size={16} aria-hidden="true" /> All stories
              </Link>
            </div>

            {article.commentsOpen && <CommentSection slug={params.slug} />}
          </div>

          <aside className="nw-article-aside">
            <div className="nw-aside-sticky">
              <div className="nw-aside-share">
                <ArticleShare title={article.title} />
              </div>
              <div className="nw-care-card">
                <span className="nw-care-icon"><Stethoscope size={20} aria-hidden="true" /></span>
                <h2>Need medical care?</h2>
                <p>Book an appointment at SECH. Our team is ready to help.</p>
                <BookButton
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    background: "var(--accent)",
                    color: "var(--text-dark)",
                  }}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {more.length > 0 && (
        <section className="nw-related">
          <div className="nw-container">
            <div className="nw-home-head">
              <h2 className="nw-related-title">More from SECH</h2>
              <Link href="/news" className="nw-btn nw-btn--ghost">
                All stories <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="nw-grid">
              {more.map((item) => (
                <NewsCard key={item.slug} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
