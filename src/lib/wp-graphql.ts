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
        `[wp] ${WP_ENDPOINT} answered with "${contentType}" instead of JSON, so the endpoint is not serving WPGraphQL.`,
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

/** Cookie settings shared by login, refresh and logout — they must match
 *  exactly, or the browser treats them as different cookies. */
export const ADMIN_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
export const SESSION_SECONDS = 60 * 60 * 2;

/** Seconds until a JWT's `exp`, or -1 if it cannot be read. */
function secondsLeft(jwt: string): number {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
    return typeof payload.exp === "number" ? payload.exp - Math.floor(Date.now() / 1000) : -1;
  } catch {
    return -1;
  }
}

const REFRESH_MUTATION = `
  mutation RefreshAuth($token: String!) {
    refreshJwtAuthToken(input: { jwtRefreshToken: $token }) { authToken }
  }
`;

/**
 * The admin's WordPress JWT, renewed when it is about to expire.
 *
 * WPGraphQL JWT tokens live for 5 minutes by default, while the console
 * session lasts 2 hours. Without renewal every request after minute five was
 * rejected — posts and bookings failed with "Internal server error" and the
 * console silently kept showing stale data. The long-lived refresh token from
 * login (httpOnly, never exposed to the browser) buys a new auth token here.
 */
export async function getAdminToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get("admin_token")?.value ?? null;
  const left = token ? secondsLeft(token) : 0;
  // -1 = unreadable (not a JWT we understand): let WordPress be the judge.
  if (token && (left > 30 || left === -1)) return token;

  const refresh = store.get("admin_refresh")?.value;
  // A session from before refresh tokens were stored: usable until it
  // expires, then treated as signed out so the console can say so plainly.
  if (!refresh) return left > 0 ? token : null;

  try {
    const response = await fetch(WP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: REFRESH_MUTATION, variables: { token: refresh } }),
      cache: "no-store",
    });
    const json = await response.json();
    const fresh: string | undefined = json?.data?.refreshJwtAuthToken?.authToken;
    if (!fresh) return null;
    try {
      // Allowed in route handlers; a no-op elsewhere. Either way this request
      // uses the fresh token, and the next one refreshes again if needed.
      store.set("admin_token", fresh, { ...ADMIN_COOKIE, maxAge: SESSION_SECONDS });
    } catch {
      /* read-only cookie store (server component) */
    }
    return fresh;
  } catch {
    return null;
  }
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
    // WPGraphQL reports auth problems as ordinary errors; map them onto real
    // statuses. The distinction matters: 401 (session gone) signs the person
    // out, 403 (signed in, but not allowed) must not — a staff writer trying
    // something beyond their role should see a message, not the login page.
    const sessionGone = /unauthenticated|expired|invalid.token|token is invalid/i.test(message);
    const forbidden = /not allowed|permission|cannot view|do not have|sorry, you/i.test(message);
    throw new WpGraphQLError(message, sessionGone ? 401 : forbidden ? 403 : 400);
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
