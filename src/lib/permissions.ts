/**
 * What each person may do in the portal, derived from their WordPress
 * capabilities — never from a role name the browser could claim.
 *
 * Shared by server and client: the server enforces these on every route; the
 * client only uses them to decide what to show. Hiding a button is a courtesy,
 * the server check is the protection.
 */

export type Perm =
  /** Can open the admin console at /admin. */
  | "portal.admin"
  /** Patient bookings — personal health data, so administrators only. */
  | "bookings"
  | "settings"
  | "team"
  | "comments"
  | "posts.write"
  | "posts.publish"
  | "posts.editOthers"
  | "media.upload"
  /** Post, edit and remove staff notices. Reading needs only a sign-in. */
  | "notices.manage"
  /** The newsletter mailing list — personal data, so administrators only. */
  | "newsletter"
  /** Contact-form messages — can include complaints and personal details. */
  | "messages";

/** WordPress capability → portal permission. */
const CAP_MAP: Record<Exclude<Perm, "portal.admin">, (caps: Set<string>) => boolean> = {
  bookings: (c) => c.has("manage_options"),
  settings: (c) => c.has("manage_options"),
  team: (c) => c.has("list_users") && c.has("create_users"),
  comments: (c) => c.has("moderate_comments"),
  "posts.write": (c) => c.has("edit_posts"),
  "posts.publish": (c) => c.has("publish_posts"),
  "posts.editOthers": (c) => c.has("edit_others_posts"),
  "media.upload": (c) => c.has("upload_files"),
  // Matches the plugin's own check for the notice board.
  "notices.manage": (c) => c.has("edit_others_posts"),
  newsletter: (c) => c.has("manage_options"),
  messages: (c) => c.has("manage_options"),
};

export function permsFromCapabilities(capabilities: string[]): Perm[] {
  const caps = new Set(capabilities);
  const perms: Perm[] = (Object.keys(CAP_MAP) as (keyof typeof CAP_MAP)[]).filter((p) => CAP_MAP[p](caps));
  // The console is for people who manage something beyond their own posts.
  if (perms.some((p) => p === "bookings" || p === "settings" || p === "comments" || p === "posts.editOthers")) {
    perms.push("portal.admin");
  }
  return perms;
}

export function can(perms: readonly Perm[] | undefined, perm: Perm): boolean {
  return !!perms?.includes(perm);
}

/** Where someone lands after signing in. */
export function homeFor(perms: readonly Perm[] | undefined): "/admin" | "/staff" {
  return can(perms, "portal.admin") ? "/admin" : "/staff";
}

/** Plain-English labels for the WordPress roles the portal assigns. */
export const ROLE_LABELS: Record<string, { label: string; description: string }> = {
  administrator: { label: "Administrator", description: "Everything, including bookings, settings and team access" },
  editor: { label: "Content manager", description: "All posts and comment moderation, but no bookings or settings" },
  author: { label: "Staff author", description: "Writes and publishes their own posts" },
  contributor: { label: "Staff writer", description: "Writes their own posts; an administrator reviews and publishes" },
  subscriber: { label: "Staff (read only)", description: "Can sign in to the staff area but not write" },
};
