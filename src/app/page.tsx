import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { StatsBar } from "@/components/sections/StatsBar";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { AboutSection } from "@/components/sections/AboutSection";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { NewsSection } from "@/components/sections/NewsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { PhotoCarousel } from "@/components/sections/PhotoCarousel";

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
  try {
    const res = await fetch("https://sech-gh.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: GET_POSTS_QUERY }),
      next: { revalidate: 60 }, // Optional: caches data and checks for updates every 60 seconds
    });
    const { data } = await res.json();
    return data?.posts?.nodes || [];
  } catch (error) {
    console.error("Error fetching homepage news:", error);
    return [];
  }
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
      {/* Pass the server-fetched data right here */}
      <NewsSection preview posts={posts} />
      <ContactSection />
    </>
  );
}
