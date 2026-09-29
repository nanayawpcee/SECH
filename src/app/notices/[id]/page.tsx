import type { Metadata } from "next";
import { wpQuery } from "@/lib/wp-graphql";
import { PUBLIC_HEADLINES_QUERY, type NoticeHeadline } from "@/lib/wp-notices";
import { PublicHeadlines } from "@/components/notices/PublicHeadlines";

export const revalidate = 60;

async function getHeadlines() {
  const data = await wpQuery<{ staffNoticeHeadlines: NoticeHeadline[] | null }>(PUBLIC_HEADLINES_QUERY, {}, 60);
  return data ? data.staffNoticeHeadlines ?? [] : null;
}

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const h = (await getHeadlines())?.find((x) => x.databaseId === Number(params.id));
  // A staff-only headline previews as a generic notice — never its title.
  const title = h?.title ? `${h.title} — SECH staff notice` : "SECH staff notice";
  const description = "Sign in to the St. Elizabeth Catholic Hospital staff portal to read the full notice.";
  return { title, description, openGraph: { title, description, images: ["/images/logo.png"], type: "article" } };
}

export default async function SharedNoticePage({ params }: Props) {
  const id = Number(params.id);
  return <PublicHeadlines headlines={await getHeadlines()} focusId={Number.isInteger(id) ? id : undefined} />;
}
