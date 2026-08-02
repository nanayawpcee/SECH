import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { USER_FIELDS, mapWpUser, type WpUserNode } from "@/lib/wp-users";

export const dynamic = "force-dynamic";

const LIST_USERS = `
  query AdminUsers($first: Int!) {
    viewer { databaseId }
    users(first: $first, where: { orderby: { field: DISPLAY_NAME, order: ASC } }) {
      nodes { ${USER_FIELDS} }
    }
  }
`;

export async function GET() {
  try {
    const data = await wpGraphQL<{
      viewer: { databaseId: number } | null;
      users: { nodes: WpUserNode[] };
    }>(LIST_USERS, { first: 100 }, { authenticated: true });

    const viewerId = data.viewer?.databaseId ?? null;
    return NextResponse.json({
      users: (data.users?.nodes ?? []).map((n) => mapWpUser(n, viewerId)),
      viewerId,
    });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const CREATE_USER = `
  mutation InviteUser(
    $username: String!
    $email: String!
    $firstName: String
    $lastName: String
    $roles: [String]
  ) {
    createUser(
      input: {
        username: $username
        email: $email
        firstName: $firstName
        lastName: $lastName
        roles: $roles
        sendUserNotification: true
      }
    ) {
      user { ${USER_FIELDS} }
    }
  }
`;

/**
 * Invite a colleague. No password is set here on purpose — WordPress emails
 * them a set-password link, so nobody has to type or transmit someone else's
 * password.
 */
export async function POST(request: Request) {
  try {
    const { name, email, role } = await request.json();

    const trimmedEmail = String(email ?? "").trim();
    const trimmedName = String(name ?? "").trim();

    if (!trimmedName) {
      return NextResponse.json({ error: "A name is required." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    // WordPress usernames cannot be changed later, so derive a stable one.
    const username =
      trimmedEmail.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase() ||
      `user${Date.now()}`;
    const [firstName, ...rest] = trimmedName.split(/\s+/);

    const data = await wpGraphQL<{ createUser: { user: WpUserNode } }>(
      CREATE_USER,
      {
        username,
        email: trimmedEmail,
        firstName,
        lastName: rest.join(" "),
        roles: [role || "editor"],
      },
      { authenticated: true },
    );

    return NextResponse.json({ user: mapWpUser(data.createUser.user, null) });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
