#!/usr/bin/env node
/**
 * Bulk-import posts into WordPress through the site's own admin API.
 *
 *   node scripts/import-posts.mjs <posts.json> [options]
 *
 * It signs in exactly as the admin console does, then for each post uploads
 * the featured image (/api/media) and creates the post (/api/posts). Going
 * through the site's routes rather than straight to WordPress means type ->
 * category and comments on/off are handled identically to the editor.
 *
 * Safe by default:
 *   - Without --apply it is a dry run: signs in, reads the existing posts and
 *     prints what it *would* do. Nothing is written.
 *   - Without --publish posts are created as DRAFTS, so you can read them in
 *     the admin console before anything goes public.
 *   - A post whose title already exists on the site is skipped, so re-running
 *     after a partial failure does not create duplicates.
 *
 * Options
 *   --base <url>     Site to import into. Default: http://localhost:3000
 *   --user <name>    WordPress username or email. Or set SECH_ADMIN_USER.
 *   --apply          Actually create posts (otherwise: dry run).
 *   --publish        Publish immediately instead of saving as drafts.
 *   --only 1,4,7     Import only these posts (1-based positions in the file).
 *
 * The password is read from SECH_ADMIN_PASSWORD, or asked for with hidden
 * input. It is sent only to the site's login route and never printed or saved.
 */

import { readFile, writeFile } from "node:fs/promises";
import { openAsBlob, existsSync } from "node:fs";
import path from "node:path";

// ── Arguments ────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const option = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 ? argv[i + 1] : undefined;
};

const file = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.match(/^--(base|user|only)$/));
if (!file) {
  console.error("Usage: node scripts/import-posts.mjs <posts.json> [--base URL] [--user NAME] [--apply] [--publish] [--only 1,2]");
  process.exit(1);
}

const BASE = (option("base") ?? "http://localhost:3000").replace(/\/+$/, "");
const APPLY = flag("apply");
const PUBLISH = flag("publish");
const ONLY = option("only")
  ?.split(",")
  .map((n) => Number(n.trim()))
  .filter((n) => Number.isInteger(n) && n > 0);

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Hidden terminal prompt, so the password never echoes or lands in history. */
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error("No terminal to prompt on. Set SECH_ADMIN_PASSWORD instead."));
      return;
    }
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        stdout.write("\n");
        process.exit(130); // Ctrl-C
      } else if (ch === "\u007f" || ch === "\b") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function askLine(question) {
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

/**
 * Titles as WordPress returns them are "texturized": straight quotes become
 * curly ones and come back as entities (Administrator&#8217;s). Normalise both
 * sides so the duplicate check compares words, not typography.
 */
function normaliseTitle(title) {
  return String(title)
    .replace(/&#8217;|&#8216;|&rsquo;|&lsquo;|[‘’]/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;|[“”]/g, '"')
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;|[–—]/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** fetch() against the site, carrying the session cookie once we have one. */
let sessionCookie = "";
async function api(route, init = {}) {
  const headers = { ...(init.headers ?? {}) };
  if (sessionCookie) headers.Cookie = sessionCookie;
  const response = await fetch(`${BASE}${route}`, { ...init, headers, redirect: "manual" });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // An HTML error page, a redirect to the login screen, a 404 from the wrong
    // --base … anything that is not our JSON API.
    throw new Error(`${route} returned ${response.status} (not JSON) — is --base pointing at the SECH site?`);
  }
  return { response, body };
}

async function signIn() {
  const user = option("user") ?? process.env.SECH_ADMIN_USER ?? (await askLine("WordPress username or email: "));
  const password = process.env.SECH_ADMIN_PASSWORD ?? (await askHidden("Password (hidden): "));

  const { response, body } = await api("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: user, password }),
  });
  if (!response.ok) throw new Error(`Sign-in failed: ${body.error ?? response.status}`);

  // Keep only the name=value part of the cookie — attributes are for browsers.
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const token = setCookie.map((c) => c.split(";")[0]).find((c) => c.startsWith("admin_token="));
  if (!token) throw new Error("Signed in, but the site did not return a session cookie.");
  sessionCookie = token;
  return body.user?.name ?? user;
}

async function uploadImage(absPath) {
  const blob = await openAsBlob(absPath, { type: "image/jpeg" });
  const form = new FormData();
  form.append("file", blob, path.basename(absPath));
  const { response, body } = await api("/api/media", { method: "POST", body: form });
  if (!response.ok || !body.id) throw new Error(body.error ?? `upload returned ${response.status}`);
  return body.id;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const postsPath = path.resolve(file);
const baseDir = path.dirname(postsPath);
const all = JSON.parse(await readFile(postsPath, "utf8"));
if (!Array.isArray(all)) throw new Error(`${file} must contain a JSON array of posts.`);

const selected = all
  .map((post, i) => ({ ...post, n: i + 1 }))
  .filter((p) => !ONLY?.length || ONLY.includes(p.n));

// Catch file problems before signing in or touching the site.
const problems = [];
for (const p of selected) {
  if (!p.title?.trim()) problems.push(`#${p.n}: missing title`);
  if (p.featuredImage && !existsSync(path.resolve(baseDir, p.featuredImage)))
    problems.push(`#${p.n}: image not found — ${p.featuredImage}`);
}
if (problems.length) {
  console.error("Fix these before importing:\n  " + problems.join("\n  "));
  process.exit(1);
}

console.log(`\n${APPLY ? "IMPORT" : "DRY RUN — nothing will be written"} → ${BASE}`);
console.log(`${selected.length} post(s) from ${path.basename(postsPath)}, as ${PUBLISH ? "PUBLISHED" : "DRAFTS"}\n`);

const who = await signIn();
console.log(`Signed in as ${who}.`);

const { response: listRes, body: listBody } = await api("/api/posts");
if (!listRes.ok) throw new Error(`Could not read existing posts: ${listBody.error ?? listRes.status}`);
const existing = new Map((listBody.posts ?? []).map((p) => [normaliseTitle(p.title), p]));
console.log(`The site has ${existing.size} post(s) already.\n`);

const log = [];
let created = 0, skipped = 0, failed = 0;

for (const p of selected) {
  const label = `#${String(p.n).padStart(2, "0")} ${p.title}`;
  const dupe = existing.get(normaliseTitle(p.title));
  if (dupe) {
    console.log(`  skip     ${label}\n           already on the site as “${dupe.title}” (${dupe.status}, id ${dupe.id})`);
    log.push({ n: p.n, title: p.title, result: "skipped-duplicate", existingId: dupe.id });
    skipped++;
    continue;
  }

  if (!APPLY) {
    console.log(`  would create  ${label}\n           ${p.type}, comments ${p.commentsOpen === false ? "off" : "on"}, image: ${p.featuredImage ?? "none"}`);
    continue;
  }

  try {
    let featuredImageId = null;
    let imageNote = "no image";
    if (p.featuredImage) {
      try {
        featuredImageId = await uploadImage(path.resolve(baseDir, p.featuredImage));
        imageNote = `image ${featuredImageId}`;
      } catch (err) {
        // A missing thumbnail is fixable in the editor; a missing post is not
        // worth losing over it.
        imageNote = `IMAGE FAILED (${err.message}) — post created without it`;
      }
    }

    const { response, body } = await api("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: p.title,
        excerpt: p.excerpt ?? "",
        content: p.content ?? "",
        type: p.type ?? "news",
        status: PUBLISH ? "published" : "draft",
        commentsOpen: p.commentsOpen !== false,
        featuredImageId,
      }),
    });
    if (!response.ok || !body.post) throw new Error(body.error ?? `create returned ${response.status}`);

    const note = body.warning ? `${imageNote}; ${body.warning}` : imageNote;
    console.log(`  created  ${label}\n           id ${body.post.databaseId}, /news/${body.post.slug}, ${note}`);
    log.push({ n: p.n, title: p.title, result: "created", id: body.post.databaseId, slug: body.post.slug, featuredImageId, note });
    existing.set(normaliseTitle(p.title), { id: body.post.databaseId, title: p.title, status: body.post.status });
    created++;
  } catch (err) {
    console.log(`  FAILED   ${label}\n           ${err.message}`);
    log.push({ n: p.n, title: p.title, result: "failed", error: err.message });
    failed++;
    // An expired session will fail every remaining post the same way.
    if (/session has expired|Unauthorized/i.test(err.message)) {
      console.log("\nSession expired — stopping. Re-run the same command; finished posts will be skipped.");
      break;
    }
  }
}

if (APPLY) {
  const logPath = path.join(baseDir, "import-log.json");
  await writeFile(logPath, JSON.stringify({ base: BASE, at: new Date().toISOString(), results: log }, null, 2));
  console.log(`\nCreated ${created}, skipped ${skipped}, failed ${failed}. Log: ${logPath}`);
  if (created && !PUBLISH) console.log("They are DRAFTS — review and publish them in the admin console.");
} else {
  console.log(`\nDry run complete. Add --apply to create them${PUBLISH ? "" : " as drafts"}.`);
}
process.exit(failed ? 1 : 0);
