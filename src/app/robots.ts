import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Served at /robots.txt. The admin and staff portals are deliberately NOT
 * disallowed here: they carry an X-Robots-Tag noindex header (next.config.js),
 * which crawlers only see if they are allowed to fetch the page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/newsletter/unsubscribe"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
