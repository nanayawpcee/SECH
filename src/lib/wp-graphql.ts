import "server-only";
import { cookies } from "next/headers";

/**
 * Server-side WPGraphQL client.
 *
 * Every admin API route goes through here so the auth token is read from the
 * httpOnly cookie in exactly one place and never reaches client JavaScript.
 */

/**
 * WordPress lives on its own subdomain: the apex now serves this site from
 * Vercel, so defaulting there would point the site at itself — it would fetch
 * its own HTML instead of GraphQL. Set WP_GRAPHQL_ENDPOINT to override.
 */
export const WP_ENDPOINT =
  process.env.WP_GRAPHQL_ENDPOINT ?? "https://wp.sech-gh.org/graphql";

/**
 * Root of the WordPress install, derived from the GraphQL endpoint so both come
 * from one env var. Used by the REST calls WPGraphQL does not cover — media
 * uploads go through wp-json, not /graphql.
 *
 * Assumes the endpoint ends in /graphql, which is the WPGraphQL default and
 * holds for subdirectory installs too (example.com/blog/graphql → example.com/blog).
 */
export const WP_BASE_URL = WP_ENDPOINT.replace(/\/graphql\/?$/, "");

/**
 * Public-page read that never throws.
 *
 * The news pages are prerendered, so a WordPress that is down, misconfigured,
 * or answering /graphql with an HTML error page would otherwise fail the whole
 * deployment — `.json()` on `<!DOCTYPE …` throws, and Next turns that into
 * "Failed to collect page data". Returns null instead: the page renders its
 * empty state, the deploy succeeds, and the next revalidation picks the posts
 * up once the CMS is healthy again.
 *
 * Admin routes keep using `wpGraphQL` below, which throws — there a failure
 * must surface to the signed-in user, not be swallowed.
 */
export async function wpQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate = 60,
): Promise<T | null> {
  try {
    const response = await fetch(WP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
    });

    if (!response.ok) {
      console.error(
        `[wp] ${WP_ENDPOINT} returned ${response.status}. A 404 usually means WordPress is not routing /graphql: check that index.php is in place (all WP routing goes through it), that WPGraphQL is active, and that permalinks have been re-saved.`,
      );
      return null;
    }

    // A misrouted /graphql serves Apache's or Next's HTML error page. Parsing
    // that as JSON is what turns a CMS outage into a failed build, so check
    // before parsing rather than catching the SyntaxError after.
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      console.error(
        `[wp] ${WP_ENDPOINT} answered with "${contentType}" instead of JSON — the endpoint is not serving WPGraphQL.`,
      );
      return null;
    }

    const payload = (await response.json()) as {
      data?: T;
      errors?: Array<{ message?: string }>;
    };

    if (payload.errors?.length) {
      console.error(
        `[wp] GraphQL errors: ${payload.errors
          .map((e) => e?.message ?? "unknown")
          .join("; ")}`,
      );
    }

    return payload.data ?? null;
  } catch (error) {
    console.error(`[wp] Could not reach ${WP_ENDPOINT}:`, error);
    return null;
  }
}

export class WpGraphQLError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "WpGraphQLError";
    this.status = status;
  }
}

/** WordPress error messages arrive as HTML; make them safe to display. */
function cleanMessage(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;[^&]+&gt;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .trim();
}

export async function getAdminToken(): Promise<string | null> {
  const store = await cookies();
  return store.get("admin_token")?.value ?? null;
}

interface WpRequestOptions {
  /** Attach the admin's JWT. Required for anything that writes. */
  authenticated?: boolean;
  /** Extra headers — used for the booking shared secret. */
  headers?: Record<string, string>;
  /** Seconds to cache. Omit for no caching (the default for admin data). */
  revalidate?: number;
}

export async function wpGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
  options: WpRequestOptions = {},
): Promise<T> {
  const { authenticated = false, headers = {}, revalidate } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (authenticated) {
    const token = await getAdminToken();
    if (!token) {
      throw new WpGraphQLError("Your session has expired. Please sign in again.", 401);
    }
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(WP_ENDPOINT, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({ query, variables }),
      ...(revalidate === undefined
        ? { cache: "no-store" as const }
        : { next: { revalidate } }),
    });
  } catch {
    throw new WpGraphQLError("Could not reach WordPress. Check the connection.", 502);
  }

  if (!response.ok && response.status >= 500) {
    throw new WpGraphQLError(`WordPress returned ${response.status}.`, 502);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string; extensions?: { category?: string } }>;
  };

  if (payload.errors?.length) {
    const first = payload.errors[0];
    const message = cleanMessage(first?.message ?? "WordPress rejected the request.");
    // WPGraphQL reports permission problems as ordinary errors; map the common
    // ones onto real HTTP statuses so the client can react properly.
    const unauthorised =
      /not allowed|permission|cannot view|unauthenticated|expired|invalid.token/i.test(
        message,
      );
    throw new WpGraphQLError(message, unauthorised ? 401 : 400);
  }

  if (!payload.data) {
    throw new WpGraphQLError("WordPress returned an empty response.", 502);
  }

  return payload.data;
}

/** Turns a thrown error into the JSON body + status an API route should return. */
export function toErrorResponse(error: unknown): { body: { error: string }; status: number } {
  if (error instanceof WpGraphQLError) {
    return { body: { error: error.message }, status: error.status };
  }
  return { body: { error: "Unexpected server error." }, status: 500 };
}
