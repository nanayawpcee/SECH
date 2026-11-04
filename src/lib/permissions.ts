// the browser only uses these to show or hide things, the API checks them again
export type Perm =
  | "portal.admin"
  | "bookings"
  | "settings"
  | "team"
  | "comments"
  | "posts.write"
  | "posts.publish"
  | "posts.editOthers"
  | "media.upload"
  | "notices.manage"
  | "newsletter"
  | "messages"
  | "staff.manage"
  | "doctors.manage";

const CAP_MAP: Record<Exclude<Perm, "portal.admin">, (caps: Set<string>) => boolean> = {
  bookings: (c) => c.has("manage_options"),
  settings: (c) => c.has("manage_options"),
  team: (c) => c.has("list_users") && c.has("create_users"),
  comments: (c) => c.has("moderate_comments"),
  "posts.write": (c) => c.has("edit_posts"),
  "posts.publish": (c) => c.has("publish_posts"),
  "posts.editOthers": (c) => c.has("edit_others_posts"),
  "media.upload": (c) => c.has("upload_files"),
  // same check as the plugin
  "notices.manage": (c) => c.has("edit_others_posts"),
  newsletter: (c) => c.has("manage_options"),
  messages: (c) => c.has("manage_options"),
  "staff.manage": (c) => c.has("sech_manage_staff"),
  "doctors.manage": (c) => c.has("edit_others_posts"),
};

export function permsFromCapabilities(capabilities: string[]): Perm[] {
  const caps = new Set(capabilities);
  const perms: Perm[] = (Object.keys(CAP_MAP) as (keyof typeof CAP_MAP)[]).filter((p) => CAP_MAP[p](caps));
  // the console is for anyone who manages more than their own posts
  if (perms.some((p) => p === "bookings" || p === "settings" || p === "comments" || p === "posts.editOthers" || p === "staff.manage")) {
    perms.push("portal.admin");
  }
  return perms;
}

export function can(perms: readonly Perm[] | undefined, perm: Perm): boolean {
  return !!perms?.includes(perm);
}

export function homeFor(perms: readonly Perm[] | undefined): "/admin" | "/staff" {
  return can(perms, "portal.admin") ? "/admin" : "/staff";
}

export const ROLE_LABELS: Record<string, { label: string; description: string }> = {
  administrator: { label: "Administrator", description: "Everything, including bookings, settings and team access" },
  sech_hr: { label: "HR officer", description: "Employee records, departments and ranks only" },
  editor: { label: "Content manager", description: "All posts and comment moderation, but no bookings or settings" },
  author: { label: "Staff author", description: "Writes and publishes their own posts" },
  contributor: { label: "Staff writer", description: "Writes their own posts; an administrator reviews and publishes" },
  subscriber: { label: "Staff (read only)", description: "Can sign in to the staff area but not write" },
};
