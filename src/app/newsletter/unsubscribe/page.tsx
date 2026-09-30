import "@/styles/legal.css";
import type { Metadata } from "next";
import { UnsubscribeCard } from "./UnsubscribeCard";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

/**
 * Linked from every newsletter email as /newsletter/unsubscribe?token=….
 * Opening the link does nothing by itself — the person presses a button —
 * because email scanners and link previewers open links automatically.
 */
export default function UnsubscribePage({ searchParams }: { searchParams: { token?: string } }) {
  const token = (searchParams.token ?? "").replace(/[^A-Za-z0-9]/g, "");
  return (
    <section className="lg-page" style={{ background: "var(--off-white)", padding: "5rem 16px" }}>
      <UnsubscribeCard token={token} />
    </section>
  );
}
