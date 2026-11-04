import { NextResponse } from "next/server";
import { getViewer } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({
    user: { id: viewer.id, name: viewer.name, email: viewer.email, roles: viewer.roles },
    perms: viewer.perms,
    mustChangePassword: viewer.mustChangePassword,
  });
}
