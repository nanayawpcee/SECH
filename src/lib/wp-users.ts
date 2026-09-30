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
  /** Still on a temporary password (plugin 1.2.0+). */
  mustChangePassword?: boolean;
}

export interface WpUserNode {
  databaseId: number;
  name: string | null;
  email: string | null;
  roles?: { nodes?: Array<{ name?: string | null; displayName?: string | null }> } | null;
  mustChangePassword?: boolean | null;
}

export const USER_FIELDS = `
  databaseId
  name
  email
  roles { nodes { name displayName } }
  mustChangePassword
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
    mustChangePassword: node.mustChangePassword === true,
  };
}

/** Roles the portal offers when inviting or editing a colleague, most
 *  restricted last. Labels describe what the person can do, not WordPress
 *  jargon — see ROLE_LABELS in lib/permissions. */
export const ASSIGNABLE_ROLES = [
  { slug: "administrator", label: "Administrator" },
  { slug: "sech_hr", label: "HR officer" },
  { slug: "editor", label: "Content manager" },
  { slug: "author", label: "Staff author" },
  { slug: "contributor", label: "Staff writer" },
  { slug: "subscriber", label: "Staff (read only)" },
];

export function isAssignableRole(role: unknown): role is string {
  return typeof role === "string" && ASSIGNABLE_ROLES.some((r) => r.slug === role);
}

/** Roles that may be created with a temporary password — never administrators. */
export const TEMP_PASSWORD_ROLES = ["sech_hr", "editor", "author", "contributor", "subscriber"];

/** WordPress-safe username: letters, numbers, dots, dashes, underscores. */
export function isValidUsername(u: unknown): u is string {
  return typeof u === "string" && /^[a-z0-9._-]{3,40}$/i.test(u);
}
