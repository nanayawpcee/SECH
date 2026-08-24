import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AdminShellSuppressor } from "../components/layout/AdminShellSuppressor";

/**
 * Lora carries every heading on the site via --font-serif.
 *
 * Self-hosted at build time rather than linked from Google, so there is no
 * third-party request on page load and no layout shift. Weight is deliberately
 * unset: Lora is a variable font, so this ships the whole 400–700 axis in one
 * file and headings asking for 800/900 clamp to 700 instead of being faux-bolded.
 */
const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-lora",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
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
    "healthcare",
    "Catholic hospital",
  ],
  openGraph: {
    title: "St. Elizabeth Catholic Hospital",
    description: "Healing with Faith & Excellence — Ahafo Region, Ghana",
    url: "https://sech-gh.org",
    siteName: "SECH Ghana",
    locale: "en_GH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={lora.variable}>
      <body>
        <AuthProvider>
          <AdminShellSuppressor>{children}</AdminShellSuppressor>
        </AuthProvider>
      </body>
    </html>
  );
}
