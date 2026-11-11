"use client";

import "@/styles/globals.css";
import "@/styles/not-found.css";
import { useEffect } from "react";
import { ErrorScreen } from "@/components/layout/ErrorScreen";
import { SITE } from "@/lib/data";

/**
 * Last resort, for an error in the root layout itself. It replaces the whole
 * page, so there is no header or footer and "Try again" does a full reload.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>{`Page didn't load | ${SITE.name}`}</title>
        <meta name="robots" content="noindex" />
      </head>
      <body>
        <ErrorScreen fullHeight digest={error.digest} onRetry={() => window.location.reload()} />
      </body>
    </html>
  );
}
