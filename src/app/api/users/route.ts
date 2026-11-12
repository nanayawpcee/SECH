import { NextResponse } from "next/server";
import { requirePerm } from "@/lib/access";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { USER_FIELDS, TEMP_PASSWORD_ROLES, isAssignableRole, isValidUsername, mapWpUser, type WpUserNode } from "@/lib/wp-users";
import { generateTempPassword } from "@/lib/temp-password";

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
  const gate = await requirePerm("team");
  if (gate instanceof NextResponse) return gate;
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

const CREATE_WITH_TEMP_PASSWORD = `
  mutation CreateStaff(
    $username: String!, $password: String!, $role: String!,
    $email: String, $firstName: String, $lastName: String
  ) {
    createStaffAccount(input: {
      username: $username, password: $password, role: $role,
      email: $email, firstName: $firstName, lastName: $lastName
    }) { account { databaseId username name email role } emailedTo }
  }
`;

// plugin 1.16.0 and earlier don't email new staff
const CREATE_WITH_TEMP_PASSWORD_OLD = CREATE_WITH_TEMP_PASSWORD.replace(" emailedTo }", " }");

type CreatedStaff = {
  createStaffAccount: {
    account: { databaseId: number; username: string; name: string; email: string; role: string };
    emailedTo?: string | null;
  };
};

async function createWithTempPassword(body: Record<string, unknown>) {
  const name = String(body.name ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim();
  const role = String(body.role ?? "contributor");

  if (!name) return NextResponse.json({ error: "A name is required." }, { status: 400 });
  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "Usernames are 3–40 characters: letters, numbers, dots, dashes or underscores." },
      { status: 400 },
    );
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address, or leave it blank." }, { status: 400 });
  }
  if (!TEMP_PASSWORD_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Administrator accounts must be created with an email invitation." },
      { status: 400 },
    );
  }

  const password = generateTempPassword();
  const [firstName, ...rest] = name.split(/\s+/);
  const vars = { username, password, role, email: email || null, firstName, lastName: rest.join(" ") };
  let data: CreatedStaff;
  try {
    data = await wpGraphQL<CreatedStaff>(CREATE_WITH_TEMP_PASSWORD, vars, { authenticated: true });
  } catch (error) {
    // only a schema mismatch retries; the account isn't created in that case
    if (!/emailedTo/.test(String((error as Error)?.message ?? ""))) throw error;
    data = await wpGraphQL<CreatedStaff>(CREATE_WITH_TEMP_PASSWORD_OLD, vars, { authenticated: true });
  }

  const emailedTo = data.createStaffAccount.emailedTo ?? null;
  return NextResponse.json(
    {
      account: data.createStaffAccount.account,
      temporaryPassword: password,
      emailedTo,
      // an address was given but nothing went out (null from an older plugin counts as not sent)
      emailFailed: !!email && !emailedTo && data.createStaffAccount.emailedTo !== undefined,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const gate = await requirePerm("team");
  if (gate instanceof NextResponse) return gate;
  try {
    const body = await request.json();
    if (body.mode === "temporary") return await createWithTempPassword(body);
    const { name, email, role } = body;
    if (role !== undefined && !isAssignableRole(role)) {
      return NextResponse.json({ error: "That role isn’t one the portal assigns." }, { status: 400 });
    }

    const trimmedEmail = String(email ?? "").trim();
    const trimmedName = String(name ?? "").trim();

    if (!trimmedName) {
      return NextResponse.json({ error: "A name is required." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

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
        roles: [role || "contributor"],
      },
      { authenticated: true },
    );

    return NextResponse.json({ user: mapWpUser(data.createUser.user, null) });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
