import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { WP_BASE_URL, getAdminToken } from "@/lib/wp-graphql";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

/** Statuses a moderator may set. Anything else is rejected outright. */
const ALLOWED = ["approved", "hold", "spam"] as const;
type Status = (typeof ALLOWED)[number];

async function requireAdmin() {
  const token = await getAdminToken();
  return token ?? null;
}

function commentId(params: Params["params"]): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Approve a comment, send it back to the queue, or mark it as spam. */
export async function PATCH(request: Request, { params }: Params) {
  const gate = await requirePerm("comments");
  if (gate instanceof NextResponse) return gate;
  const adminToken = await requireAdmin();
  if (!adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = commentId(params);
  if (id === null) {
    return NextResponse.json({ error: "Invalid comment id." }, { status: 400 });
  }

  const { status } = await request.json();
  if (!ALLOWED.includes(status as Status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${ALLOWED.join(", ")}.` },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/comments/${id}`, {
      method: "POST", // WP REST accepts POST for updates; avoids PUT/CORS quirks
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      return NextResponse.json(
        { error: detail?.message ?? `WordPress returned ${response.status}.` },
        { status: response.status === 401 ? 401 : 502 },
      );
    }

    const updated = await response.json();
    return NextResponse.json({ id, status: updated?.status ?? status });
  } catch (error) {
    console.error("[wp] Could not update comment:", error);
    return NextResponse.json({ error: "Could not reach WordPress." }, { status: 502 });
  }
}

/** Move a comment to the WordPress trash — recoverable, not a hard delete. */
export async function DELETE(_request: Request, { params }: Params) {
  const gate = await requirePerm("comments");
  if (gate instanceof NextResponse) return gate;
  const adminToken = await requireAdmin();
  if (!adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = commentId(params);
  if (id === null) {
    return NextResponse.json({ error: "Invalid comment id." }, { status: 400 });
  }

  try {
    const response = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/comments/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `WordPress returned ${response.status}.` },
        { status: response.status === 401 ? 401 : 502 },
      );
    }

    return NextResponse.json({ id, deleted: true });
  } catch (error) {
    console.error("[wp] Could not delete comment:", error);
    return NextResponse.json({ error: "Could not reach WordPress." }, { status: 502 });
  }
}
