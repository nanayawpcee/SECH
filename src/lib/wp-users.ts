/** An administrator account as the Settings > Admins tab needs it. */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  roleSlug: string;
  initials: string;
  /** True for the account currently signed in — it must not delete itself. */
  isSelf: boolean;
}

export interface WpUserNode {
  databaseId: number;
  name: string | null;
  email: string | null;
  roles?: { nodes?: Array<{ name?: string | null; displayName?: string | null }> } | null;
}

export const USER_FIELDS = `
  databaseId
  name
  email
  roles { nodes { name displayName } }
`;

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "??"
  );
}

export function mapWpUser(node: WpUserNode, viewerId: number | null): AdminUser {
  const primary = node.roles?.nodes?.[0];
  const name = node.name ?? "Unknown";
  return {
    id: node.databaseId,
    name,
    email: node.email ?? "",
    role: primary?.displayName ?? primary?.name ?? "Subscriber",
    roleSlug: primary?.name ?? "subscriber",
    initials: initialsOf(name),
    isSelf: viewerId !== null && node.databaseId === viewerId,
  };
}

/** Roles the portal offers when inviting or editing a colleague. */
export const ASSIGNABLE_ROLES = [
  { slug: "administrator", label: "Administrator" },
  { slug: "editor", label: "Editor" },
  { slug: "author", label: "Author" },
  { slug: "subscriber", label: "Viewer" },
];
