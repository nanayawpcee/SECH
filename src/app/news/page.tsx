import "@/styles/news.css";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { NewsBrowser } from "@/components/news/NewsBrowser";
import { getNewsItems } from "@/lib/news-data";

export const metadata: Metadata = {
  alternates: { canonical: "/news" },
  title: "News & Announcements",
  description:
    "Stay up to date with the latest news, events, and health updates from St. Elizabeth Catholic Hospital.",
};

export default async function NewsPage() {
  // [] when the CMS is unreachable, so the page still renders its empty state.
  const items = await getNewsItems(60);

  return (
    <>
      <PageHero
        tag="Latest Updates"
        title="News & Announcements"
        subtitle="Events, health campaigns, hospital updates, and community outreach from SECH."
        dotGrid
      />
      <section className="nw-page">
        <div className="nw-container">
          <NewsBrowser items={items} />
        </div>
      </section>
    </>
  );
}
