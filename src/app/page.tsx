import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { StatsBar } from "@/components/sections/StatsBar";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { AboutSection } from "@/components/sections/AboutSection";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { NewsSection, type WPPost } from "@/components/sections/NewsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { PhotoCarousel } from "@/components/sections/PhotoCarousel";
import { wpQuery } from "@/lib/wp-graphql";

const GET_POSTS_QUERY = `
  query GetPosts {
    posts(first: 10) {
      nodes {
        slug
        title
        excerpt
        date
        categories {
          nodes {
            name
          }
        }
      }
    }
  }
`;

async function getPosts() {
  const data = await wpQuery<{ posts: { nodes: WPPost[] } }>(
    GET_POSTS_QUERY,
  );
  return data?.posts?.nodes ?? [];
}

export default async function HomePage() {
  // Fetch data on the server side
  const posts = await getPosts();

  return (
    <>
      <HeroCarousel />
      <StatsBar />
      <PhotoCarousel />
      <ServicesGrid preview />
      <AboutSection />
      <EmergencyBanner />
      <NewsSection preview posts={posts} />
      <ContactSection />
    </>
  );
}
