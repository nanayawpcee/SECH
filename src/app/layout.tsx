import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AdminShellSuppressor } from "../components/layout/AdminShellSuppressor";
import { wpQuery } from "@/lib/wp-graphql";
import { CURRENT_NEWSLETTER_QUERY, type NewsletterIssue } from "@/lib/wp-newsletter";
import { SITE } from "@/lib/data";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo";

const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-lora",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "St. Elizabeth Catholic Hospital | Hwidiem, Ghana",
    template: "%s | St. Elizabeth Catholic Hospital",
  },
  description:
    "St. Elizabeth Catholic Hospital (SECH) provides world-class, compassionate Catholic healthcare to the communities of Ghana's Ahafo Region. A CHAG member institution.",
  keywords: [
    "hospital",
    "Ghana",
    "CHAG",
    "Hwidiem",
    "Ahafo Region",
    "Asutifi South",
    "healthcare",
    "Catholic hospital",
    "emergency",
    "NHIS",
  ],
  applicationName: SITE.name,
  openGraph: {
    title: "St. Elizabeth Catholic Hospital",
    description: "Healing with Faith & Excellence in the Ahafo Region, Ghana",
    siteName: "SECH Ghana",
    locale: "en_GH",
    type: "website",
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_SHARE_IMAGE.url] },
};

async function getCurrentNewsletter() {
  const data = await wpQuery<{ currentNewsletter: NewsletterIssue | null }>(CURRENT_NEWSLETTER_QUERY, {}, 300);
  return data?.currentNewsletter ?? null;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const newsletter = await getCurrentNewsletter();
  return (
    <html lang="en" className={lora.variable}>
      <body>
        <AuthProvider>
          <AdminShellSuppressor newsletter={newsletter}>{children}</AdminShellSuppressor>
        </AuthProvider>
      </body>
    </html>
  );
}
