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
  | "doctors.manage"
  // accounts office collections, payments and receipts
  | "accounts"
  // given per accounts officer by an administrator (plugin 1.20.0); administrators have them all
  | "accounts.void"
  | "accounts.payout"
  | "accounts.reports"
  | "accounts.rent";

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
  "notices.manage": (c) => c.has("sech_manage_notices") || c.has("edit_others_posts"),
  newsletter: (c) => c.has("manage_options"),
  messages: (c) => c.has("manage_options"),
  "staff.manage": (c) => c.has("sech_manage_staff"),
  "doctors.manage": (c) => c.has("edit_others_posts"),
  accounts: (c) => c.has("sech_accounts"),
  "accounts.void": (c) => c.has("sech_accounts") && c.has("sech_acc_void"),
  "accounts.payout": (c) => c.has("sech_accounts") && c.has("sech_acc_payout"),
  "accounts.reports": (c) => c.has("sech_accounts") && c.has("sech_acc_reports"),
  "accounts.rent": (c) => c.has("sech_accounts") && c.has("sech_acc_rent"),
};

export function permsFromCapabilities(capabilities: string[]): Perm[] {
  const caps = new Set(capabilities);
  const perms: Perm[] = (Object.keys(CAP_MAP) as (keyof typeof CAP_MAP)[]).filter((p) => CAP_MAP[p](caps));
  // the console is for anyone who manages more than their own posts
  if (perms.some((p) => p === "bookings" || p === "settings" || p === "comments" || p === "posts.editOthers" || p === "staff.manage" || p === "accounts")) {
    perms.push("portal.admin");
  }
  return perms;
}

export function can(perms: readonly Perm[] | undefined, perm: Perm): boolean {
  return !!perms?.includes(perm);
}

// Areas kept out of the sidebar and the command palette for now. The pages and
// their API still work for anyone allowed, so emptying this list brings them back.
const HIDDEN_FROM_MENUS: readonly Perm[] = [];

export function inMenus(perms: readonly Perm[] | undefined, perm: Perm): boolean {
  return can(perms, perm) && !HIDDEN_FROM_MENUS.includes(perm);
}

// accounts officers with nothing else to manage go straight to their page
const DASHBOARD_PERMS: Perm[] = ["bookings", "settings", "comments", "posts.editOthers", "staff.manage"];

export function homeFor(perms: readonly Perm[] | undefined): "/admin" | "/admin/accounts" | "/staff" {
  if (!can(perms, "portal.admin")) return "/staff";
  return can(perms, "accounts") && !DASHBOARD_PERMS.some((p) => can(perms, p)) ? "/admin/accounts" : "/admin";
}

export const ROLE_LABELS: Record<string, { label: string; description: string }> = {
  administrator: { label: "Administrator", description: "Everything, including bookings, settings and team access" },
  sech_hr: { label: "HR officer", description: "Employee records, departments and ranks only" },
  sech_accounts: { label: "Accounts officer", description: "Accounts office collections, payments and receipts only" },
  editor: { label: "Content manager", description: "All posts and comment moderation, but no bookings or settings" },
  author: { label: "Staff author", description: "Writes and publishes their own posts" },
  contributor: { label: "Staff writer", description: "Writes their own posts; an administrator reviews and publishes" },
  subscriber: { label: "Staff (read only)", description: "Can sign in to the staff area but not write" },
};
