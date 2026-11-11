import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { StatsBar } from "@/components/sections/StatsBar";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { AboutSection } from "@/components/sections/AboutSection";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { NewsSection } from "@/components/sections/NewsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { PhotoCarousel } from "@/components/sections/PhotoCarousel";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { getHomeNews } from "@/lib/news-data";
import { hospitalJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { posts, featured } = await getHomeNews(3);

  return (
    <>
      <JsonLd data={hospitalJsonLd()} />
      <HeroCarousel story={featured} />
      <StatsBar />
      <PhotoCarousel story={featured} />
      <ServicesGrid preview />
      <AboutSection />
      <EmergencyBanner />
      <NewsSection posts={posts} />
      <ContactSection />
    </>
  );
}
