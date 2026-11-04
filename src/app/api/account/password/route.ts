import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse, WP_ENDPOINT, getAdminToken } from "@/lib/wp-graphql";
import { forgetViewer, requireSignedInAllowingPasswordChange } from "@/lib/access";

export const dynamic = "force-dynamic";

const VIEWER = `
  query CurrentUser {
    viewer { databaseId username email }
  }
`;

const SET_PASSWORD = `
  mutation SetPassword($id: ID!, $password: String!) {
    updateUser(input: { id: $id, password: $password }) {
      user { databaseId }
    }
  }
`;

const LOGIN = `
  mutation VerifyCurrent($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
    }
  }
`;

export async function POST(request: Request) {
  const gate = await requireSignedInAllowingPasswordChange();
  if (gate instanceof NextResponse) return gate;
  try {
    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Enter your current and new password." },
        { status: 400 },
      );
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json({ error: "The new passwords do not match." }, { status: 400 });
    }
    if (String(newPassword).length < 12) {
      return NextResponse.json(
        { error: "Use at least 12 characters for the new password." },
        { status: 400 },
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "The new password must be different from the current one." },
        { status: 400 },
      );
    }

    const me = await wpGraphQL<{
      viewer: { databaseId: number; username: string | null; email: string | null } | null;
    }>(VIEWER, {}, { authenticated: true });

    if (!me.viewer) {
      return NextResponse.json({ error: "Your session has expired." }, { status: 401 });
    }

    const verifyResponse = await fetch(WP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        query: LOGIN,
        variables: {
          username: me.viewer.username ?? me.viewer.email ?? "",
          password: currentPassword,
        },
      }),
    });
    const verified = await verifyResponse.json();

    if (!verified?.data?.login?.authToken) {
      return NextResponse.json(
        { error: "Your current password is not correct." },
        { status: 400 },
      );
    }

    await wpGraphQL<{ updateUser: { user: { databaseId: number } } }>(
      SET_PASSWORD,
      { id: String(me.viewer.databaseId), password: newPassword },
      { authenticated: true },
    );

    forgetViewer(await getAdminToken());
    return NextResponse.json({ success: true });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
