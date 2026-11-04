import type { Metadata } from "next";
import "@/styles/admin.css";
import "@/styles/notices.css";
import { adminFont } from "@/app/admin/fonts";

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
