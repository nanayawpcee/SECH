import "@/styles/legal.css";
import type { Metadata } from "next";
import { UnsubscribeCard } from "./UnsubscribeCard";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = ((await searchParams).token ?? "").replace(/[^A-Za-z0-9]/g, "");
  return (
    <section className="lg-page" style={{ background: "var(--off-white)", padding: "5rem 16px" }}>
      <UnsubscribeCard token={token} />
    </section>
  );
}
