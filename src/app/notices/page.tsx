import type { Metadata } from "next";
import { wpQuery } from "@/lib/wp-graphql";
import { PUBLIC_HEADLINES_QUERY, type NoticeHeadline } from "@/lib/wp-notices";
import { PublicHeadlines } from "@/components/notices/PublicHeadlines";

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
    title: "Staff notice board",
    description,
    openGraph: { title, description, images: ["/images/logo.png"], type: "website" },
  };
}

export default async function PublicNoticesPage() {
  return <PublicHeadlines headlines={await getHeadlines()} />;
}
