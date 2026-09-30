import type { Metadata } from "next";
import { wpQuery } from "@/lib/wp-graphql";
import { PUBLIC_HEADLINES_QUERY, type NoticeHeadline } from "@/lib/wp-notices";
import { PublicHeadlines } from "@/components/notices/PublicHeadlines";

// Refreshed at most every minute, and immediately when a manager posts
// (the notices API revalidates this path).
export const revalidate = 60;

async function getHeadlines() {
  const data = await wpQuery<{ staffNoticeHeadlines: NoticeHeadline[] | null }>(PUBLIC_HEADLINES_QUERY, {}, 60);
  return data ? data.staffNoticeHeadlines ?? [] : null;
}

export async function generateMetadata(): Promise<Metadata> {
  const headlines = await getHeadlines();
  const n = headlines?.length ?? 0;
  const title = "Staff notice board | St. Elizabeth Catholic Hospital";
  const description = n
    ? `${n} current notice${n === 1 ? "" : "s"} for SECH staff. Sign in to read the details.`
    : "Notices for St. Elizabeth Catholic Hospital staff.";
  return {
    // The site template already appends the hospital name to the tab title.
    title: "Staff notice board",
    description,
    // What WhatsApp and other apps show in the link preview.
    openGraph: { title, description, images: ["/images/logo.png"], type: "website" },
  };
}

export default async function PublicNoticesPage() {
  return <PublicHeadlines headlines={await getHeadlines()} />;
}
