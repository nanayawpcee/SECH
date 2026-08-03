import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import { PageHero } from "@/components/ui/PageHero";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { BookButton } from "@/components/ui/BookButton";
import { WP_ENDPOINT } from "@/lib/wp-graphql";

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

async function getPost(slug: string) {
  const response = await fetch(WP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetPost($slug: String!) {
          postBy(slug: $slug) {
            id
            title
            date
            excerpt
            content
            featuredImage {
              node {
                sourceUrl
                altText
              }
            }
            categories {
              nodes {
                name
              }
            }
          }
        }
      `,
      variables: { slug },
    }),
    next: { revalidate: 60 },
  });

  const { data } = await response.json();
  return data?.postBy;
}

async function getAllPosts() {
  const response = await fetch(WP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetAllPosts {
          posts(first: 20) {
            nodes {
              slug
            }
          }
        }
      `,
    }),
    next: { revalidate: 60 },
  });

  const { data } = await response.json();
  return data?.posts?.nodes || [];
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post: any) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Article Not Found" };

  return {
    title: post.title,
    description: post.excerpt?.replace(/<[^>]+>/g, "") || "",
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getPost(params.slug);
  if (!article) notFound();

  const category = article.categories?.nodes[0]?.name || "News";

  return (
    <>
      <PageHero
        tag={category}
        title={article.title}
        subtitle={article.excerpt?.replace(/<[^>]+>/g, "") || ""}
        backgroundImage={article.featuredImage?.node?.sourceUrl}
      />

      <section style={{ padding: "5rem 2rem", background: "#fff" }}>
        <div
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Main Content */}
          <AnimateIn>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: "2rem",
                paddingBottom: "1.5rem",
                borderBottom: "1px solid #E2EBE7",
              }}
            >
              {article.featuredImage?.node?.sourceUrl && (
                <Image
                  src={article.featuredImage.node.sourceUrl}
                  alt={article.featuredImage.node.altText || article.title}
                  width={400}
                  height={300}
                  sizes="20vw"
                  style={{ width: "20%", height: "auto", borderRadius: "8px" }}
                />
              )}
              <div>
                <span
                  style={{
                    padding: "4px 12px",
                    background: "var(--primary)",
                    color: "#fff",
                    borderRadius: 3,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {category}
                </span>
                <span
                  style={{
                    color: "var(--text-light)",
                    fontSize: "0.84rem",
                    display: "block",
                    marginTop: "8px",
                  }}
                >
                  {new Date(article.date).toLocaleDateString("en-GB", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div
              style={{
                color: "var(--text-mid)",
                lineHeight: 1.85,
                fontSize: "1.05rem",
              }}
              dangerouslySetInnerHTML={{ __html: sanitizeArticleContent(article.content) }}
            />

            <div
              style={{
                marginTop: "2.5rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #E2EBE7",
              }}
            >
              <Link
                href="/news"
                style={{
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                }}
              >
                ← Back to All News
              </Link>
            </div>
          </AnimateIn>

          {/* Sidebar */}
          <AnimateIn delay={140} direction="right">
            <div style={{ position: "sticky", top: 90 }}>
              <div
                style={{
                  background: "var(--primary)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    color: "#fff",
                    fontFamily: "var(--font-serif)",
                    fontSize: "1rem",
                    fontWeight: 800,
                    margin: "0 0 10px",
                  }}
                >
                  Need Medical Care?
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.82rem",
                    lineHeight: 1.6,
                    margin: "0 0 1rem",
                  }}
                >
                  Book an appointment at SECH — our team is ready to help.
                </p>
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
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
