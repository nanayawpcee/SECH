import "server-only";
import { cookies } from "next/headers";

export const WP_ENDPOINT =
  process.env.WP_GRAPHQL_ENDPOINT ?? "https://wp.sech-gh.org/graphql";

export const WP_BASE_URL = WP_ENDPOINT.replace(/\/graphql\/?$/, "");

// for public pages: never throws, returns null if WordPress is down
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

    // a misrouted /graphql sends back an HTML error page, so check before parsing
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

function cleanMessage(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;[^&]+&gt;/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .trim();
}

// login, refresh and logout must all use these exact settings
export const ADMIN_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
export const SESSION_SECONDS = 60 * 60 * 2;

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

// JWTs only last a few minutes, refresh them here when they're nearly expired
export async function getAdminToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get("admin_token")?.value ?? null;
  const left = token ? secondsLeft(token) : 0;
  if (token && (left > 30 || left === -1)) return token;

  const refresh = store.get("admin_refresh")?.value;
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
      store.set("admin_token", fresh, { ...ADMIN_COOKIE, maxAge: SESSION_SECONDS });
    } catch {
    }
    return fresh;
  } catch {
    return null;
  }
}

interface WpRequestOptions {
  authenticated?: boolean;
  headers?: Record<string, string>;
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
    // 401 signs the person out, 403 doesn't (signed in but not allowed)
    const sessionGone = /unauthenticated|expired|invalid.token|token is invalid/i.test(message);
    const forbidden = /not allowed|permission|cannot view|do not have|sorry, you/i.test(message);
    throw new WpGraphQLError(message, sessionGone ? 401 : forbidden ? 403 : 400);
  }

  if (!payload.data) {
    throw new WpGraphQLError("WordPress returned an empty response.", 502);
  }

  return payload.data;
}

export function toErrorResponse(error: unknown): { body: { error: string }; status: number } {
  if (error instanceof WpGraphQLError) {
    return { body: { error: error.message }, status: error.status };
  }
  return { body: { error: "Unexpected server error." }, status: 500 };
}
