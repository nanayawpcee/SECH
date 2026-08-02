import "server-only";
import { cookies } from "next/headers";

/**
 * Server-side WPGraphQL client.
 *
 * Every admin API route goes through here so the auth token is read from the
 * httpOnly cookie in exactly one place and never reaches client JavaScript.
 */

export const WP_ENDPOINT =
  process.env.WP_GRAPHQL_ENDPOINT ?? "https://sech-gh.org/graphql";

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
