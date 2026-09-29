import "server-only";
import { NextResponse } from "next/server";
import { WP_ENDPOINT, getAdminToken } from "@/lib/wp-graphql";
import { permsFromCapabilities, type Perm } from "@/lib/permissions";

export interface Viewer {
  id: number;
  name: string;
  email: string;
  roles: string[];
  perms: Perm[];
  /** Signed in with a temporary password that hasn't been replaced yet. */
  mustChangePassword: boolean;
}

const VIEWER_FIELDS = `databaseId name email roles { nodes { name } } capabilities`;
const VIEWER_QUERY = `query PortalViewer { viewer { ${VIEWER_FIELDS} mustChangePassword } }`;
// For a WordPress still on plugin < 1.2.0, which doesn't know mustChangePassword.
const VIEWER_QUERY_LEGACY = `query PortalViewer { viewer { ${VIEWER_FIELDS} } }`;

/**
 * Who is signed in, and what WordPress lets them do. Cached briefly per token:
 * every API call needs it, and roles change rarely. A role change takes effect
 * within a minute, or immediately on the next sign-in.
 */
const cache = new Map<string, { at: number; viewer: Viewer }>();
const TTL_MS = 60_000;

export async function viewerForToken(token: string): Promise<Viewer | null> {
  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.viewer;

  const ask = async (query: string) => {
    const res = await fetch(WP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    return res.json();
  };
  try {
    let json = await ask(VIEWER_QUERY);
    if (json?.errors?.some((e: { message?: string }) => /mustChangePassword/.test(e.message ?? ""))) {
      json = await ask(VIEWER_QUERY_LEGACY);
    }
    const v = json?.data?.viewer;
    if (!v?.databaseId) return null;
    const viewer: Viewer = {
      id: Number(v.databaseId),
      name: String(v.name ?? ""),
      email: String(v.email ?? ""),
      roles: (v.roles?.nodes ?? []).map((r: { name: string }) => r.name),
      perms: permsFromCapabilities(Array.isArray(v.capabilities) ? v.capabilities : []),
      mustChangePassword: v.mustChangePassword === true,
    };
    if (cache.size > 500) cache.clear();
    cache.set(token, { at: Date.now(), viewer });
    return viewer;
  } catch {
    return null;
  }
}

/** Drop the cached viewer, e.g. after a password change clears the flag. */
export function forgetViewer(token: string | null | undefined) {
  if (token) cache.delete(token);
}

export async function getViewer(): Promise<Viewer | null> {
  const token = await getAdminToken();
  return token ? viewerForToken(token) : null;
}

/**
 * Gate for API routes. Returns the viewer when allowed, or a ready-made error
 * response: 401 when nobody is signed in, 403 when they are but may not.
 *
 *   const gate = await requirePerm("bookings");
 *   if (gate instanceof NextResponse) return gate;
 */
export async function requirePerm(...perms: Perm[]): Promise<Viewer | NextResponse> {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  }
  // Until a temporary password is replaced, nothing else is allowed — enforced
  // here, not just by the page redirect.
  if (viewer.mustChangePassword) {
    return NextResponse.json(
      { error: "Choose your own password before continuing.", code: "PASSWORD_CHANGE_REQUIRED" },
      { status: 403 },
    );
  }
  if (!perms.every((p) => viewer.perms.includes(p))) {
    return NextResponse.json({ error: "Your account doesn’t have access to this." }, { status: 403 });
  }
  return viewer;
}

/** Signed in — and allowed even while a temporary password is pending. For the
 *  routes a person needs in order to replace it. */
export async function requireSignedInAllowingPasswordChange(): Promise<Viewer | NextResponse> {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  }
  return viewer;
}
