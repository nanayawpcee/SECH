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
  mustChangePassword: boolean;
}

const VIEWER_FIELDS = `databaseId name email roles { nodes { name } } capabilities`;
const VIEWER_QUERY = `query PortalViewer { viewer { ${VIEWER_FIELDS} mustChangePassword } }`;
const VIEWER_QUERY_LEGACY = `query PortalViewer { viewer { ${VIEWER_FIELDS} } }`;

// cached briefly per token, every API call needs the viewer
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

export function forgetViewer(token: string | null | undefined) {
  if (token) cache.delete(token);
}

export async function getViewer(): Promise<Viewer | null> {
  const token = await getAdminToken();
  return token ? viewerForToken(token) : null;
}

// top of every API route: 401 if signed out, 403 if not allowed
export async function requirePerm(...perms: Perm[]): Promise<Viewer | NextResponse> {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  }
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

export async function requireSignedInAllowingPasswordChange(): Promise<Viewer | NextResponse> {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  }
  return viewer;
}
