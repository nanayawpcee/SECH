import { useEffect, useState } from "react";
import Head from "next/head";
import { ErrorScreen } from "@/components/layout/ErrorScreen";
import { SITE } from "@/lib/data";

/**
 * Next serves this instead of src/app/error.tsx when a page fails while it is
 * first being generated, most often a story opened for the first time after a
 * deploy while WordPress is answering 508. It's built once at deploy time, so
 * it can't know which page failed; "Try again" reloads the address in the bar.
 */
export default function ServerErrorPage() {
  // built ahead of time, so read the address once it's in the browser
  const [portal, setPortal] = useState<"/admin" | "/staff">();
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/admin")) setPortal("/admin");
    else if (path.startsWith("/staff")) setPortal("/staff");
  }, []);

  return (
    <>
      <Head>
        <title>{`Page didn't load | ${SITE.name}`}</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ErrorScreen fullHeight portal={portal} onRetry={() => window.location.reload()} />
    </>
  );
}
