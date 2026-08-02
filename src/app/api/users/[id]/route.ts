import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { USER_FIELDS, mapWpUser, type WpUserNode } from "@/lib/wp-users";

export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

const UPDATE_USER = `
  mutation UpdateAdminUser($id: ID!, $roles: [String], $firstName: String, $lastName: String) {
    updateUser(input: { id: $id, roles: $roles, firstName: $firstName, lastName: $lastName }) {
      user { ${USER_FIELDS} }
    }
  }
`;

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { name, role } = await request.json();

    let firstName: string | undefined;
    let lastName: string | undefined;
    if (typeof name === "string" && name.trim()) {
      const [first, ...rest] = name.trim().split(/\s+/);
      firstName = first;
      lastName = rest.join(" ");
    }

    const data = await wpGraphQL<{ updateUser: { user: WpUserNode } }>(
      UPDATE_USER,
      {
        id: params.id,
        roles: role ? [role] : undefined,
        firstName,
        lastName,
      },
      { authenticated: true },
    );

    return NextResponse.json({ user: mapWpUser(data.updateUser.user, null) });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const VIEWER = `{ viewer { databaseId } }`;

const DELETE_USER = `
  mutation RemoveAdminUser($id: ID!, $reassignId: ID) {
    deleteUser(input: { id: $id, reassignId: $reassignId }) {
      deletedId
    }
  }
`;

export async function DELETE(request: Request, { params }: Params) {
  try {
    const viewer = await wpGraphQL<{ viewer: { databaseId: number } | null }>(
      VIEWER,
      {},
      { authenticated: true },
    );

    // Deleting your own account would lock you out mid-session.
    if (viewer.viewer && String(viewer.viewer.databaseId) === String(params.id)) {
      return NextResponse.json(
        { error: "You cannot remove your own account." },
        { status: 400 },
      );
    }

    const url = new URL(request.url);
    // Their posts are reassigned rather than deleted along with them.
    const reassignId = url.searchParams.get("reassignId") ?? viewer.viewer?.databaseId;

    await wpGraphQL<{ deleteUser: { deletedId: string } }>(
      DELETE_USER,
      { id: params.id, reassignId: reassignId ? String(reassignId) : null },
      { authenticated: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
