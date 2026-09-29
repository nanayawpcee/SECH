import { NextResponse } from "next/server";
import { getViewer } from "@/lib/access";

export const dynamic = "force-dynamic";

/**
 * The signed-in person and their permissions, straight from WordPress. The
 * portal refreshes this on load, so a role changed by an administrator applies
 * without the person needing to know anything happened.
 */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({
    user: { id: viewer.id, name: viewer.name, email: viewer.email, roles: viewer.roles },
    perms: viewer.perms,
    mustChangePassword: viewer.mustChangePassword,
  });
}
