import type { Metadata } from "next";
import "@/styles/admin.css";
// A real stylesheet, not an inline <style>: in a server component the inline
// version is escaped differently on the server and in the browser (quotes in
// attribute selectors), which React reports as a hydration mismatch.
import "@/styles/notices.css";
import { adminFont } from "@/app/admin/fonts";

/**
 * The shareable staff notice board. Deliberately kept out of search engines:
 * headlines are meant for staff following a link, not for Google.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function NoticesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`po-root ${adminFont.variable}`} style={{ minHeight: "100vh" }}>
      {children}
    </div>
  );
}
