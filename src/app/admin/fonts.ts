import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * The admin console's typeface. A geometric grotesque with real tabular
 * figures, which keeps counts and dates aligned in tables and KPI tiles.
 * Self-hosted by next/font, so the console makes no requests to Google.
 */
export const adminFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-admin",
  display: "swap",
});
