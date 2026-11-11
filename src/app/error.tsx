"use client";

import "@/styles/not-found.css";
import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ErrorScreen } from "@/components/layout/ErrorScreen";
import { SITE } from "@/lib/data";

/**
 * Shown inside the site's header and footer when a page fails while the visitor
 * is already on the site. "Try again" asks the server for a fresh copy rather
 * than only re-rendering what failed. (A story opened for the first time while
 * WordPress is down gets the static 500 page in src/pages/500.tsx instead.)
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [retrying, startRetry] = useTransition();
  const portal = pathname.startsWith("/admin") ? "/admin" : pathname.startsWith("/staff") ? "/staff" : undefined;

  useEffect(() => {
    console.error(error);
    const before = document.title;
    document.title = `Page didn't load | ${SITE.name}`;
    return () => { document.title = before; };
  }, [error]);

  return (
    <ErrorScreen
      retrying={retrying}
      portal={portal}
      digest={error.digest}
      onRetry={() =>
        startRetry(() => {
          router.refresh();
          reset();
        })
      }
    />
  );
}
