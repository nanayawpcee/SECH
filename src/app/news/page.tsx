import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { NewsSection, type WPPost } from "@/components/sections/NewsSection";
import { wpQuery } from "@/lib/wp-graphql";

export const metadata: Metadata = {
  title: "News & Announcements",
  description:
    "Stay up to date with the latest news, events, and health updates from St. Elizabeth Catholic Hospital.",
};

// Fetch news from WordPress GraphQL. Returns [] when the CMS is unreachable,
// so the page still builds and renders its empty state.
async function getNewsPosts() {
  const data = await wpQuery<{ posts: { nodes: WPPost[] } }>(`
    query GetNewsPosts {
      posts(
        first: 12
        where: {
          status: PUBLISH,
          orderby: { field: DATE, order: DESC }
        }
      ) {
        nodes {
          id
          title
          slug
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
    }
  `);

  return data?.posts?.nodes ?? [];
}

export default async function NewsPage() {
  const posts = await getNewsPosts();

  return (
    <>
      <PageHero
        tag="Latest Updates"
        title="News & Announcements"
        subtitle="Events, health campaigns, hospital updates, and community outreach from SECH."
        dotGrid
      />
      <NewsSection posts={posts} />
    </>
  );
}
