import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Public comments on news and achievement posts.
 *
 * The security model in one line: a visitor's comment is NEVER treated as
 * markup. It is stripped to plain text on the way in and again on the way out,
 * and rendered through React as a text node — never `dangerouslySetInnerHTML`,
 * which is what the article body uses and what comments must never use.
 *
 * Stripping on the way IN matters as much as on the way out: staff read the
 * moderation queue inside wp-admin, where a stored script would run against a
 * logged-in administrator.
 */

export interface PublicComment {
  id: string;
  author: string;
  /** Plain text. Safe to render as a text node; never as HTML. */
  content: string;
  date: string;
}

interface WpCommentNode {
  id: string;
  date: string | null;
  content: string | null;
  author: { node: { name: string | null } | null } | null;
}

/**
 * Reduce anything to plain text: every tag dropped, entities decoded once,
 * whitespace tidied. `allowedTags: []` with `allowedAttributes: {}` is the
 * whole defence — there is no tag an attacker can smuggle through.
 */
export function toPlainText(input: string, maxLength = 2000): string {
  const stripped = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    // Drop the contents of these outright rather than keeping their text.
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
    disallowedTagsMode: "discard",
  });

  // sanitize-html escapes text output, so "Mother & child" comes back as
  // "Mother &amp; child" and would be *displayed* that way. Decode once, after
  // every tag has been discarded. This is safe because the result is only ever
  // rendered as a React text node, which escapes it again on output — decoding
  // here fixes display without letting markup back into the page.
  const decoded = stripped
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&"); // last, so "&amp;lt;" cannot become "<"

  return decoded
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

/** Display name: plain text, single line, length-capped. */
export function toPlainName(input: string, maxLength = 60): string {
  return toPlainText(input, maxLength).replace(/\s*\n\s*/g, " ").trim();
}

export function mapComment(node: WpCommentNode): PublicComment {
  return {
    id: node.id,
    author: toPlainName(node.author?.node?.name ?? "") || "Anonymous",
    content: toPlainText(node.content ?? ""),
    date: node.date ?? "",
  };
}

/**
 * Only approved comments, and deliberately no author email — that field must
 * never leave the server, or the page becomes an address-harvesting endpoint.
 */
export const APPROVED_COMMENTS_QUERY = `
  query PostComments($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      databaseId
      commentCount
      comments(
        first: 100
        where: { order: ASC, orderby: COMMENT_DATE }
      ) {
        nodes {
          id
          date
          content
          author { node { name } }
        }
      }
    }
  }
`;

/**
 * WPGraphQL's own mutation — no custom plugin code needed. WordPress applies
 * its Discussion settings to it, so with "Comment must be manually approved"
 * enabled the comment is created as pending and is invisible until staff
 * approve it in wp-admin.
 */
export const CREATE_COMMENT_MUTATION = `
  mutation AddComment(
    $commentOn: Int!
    $author: String!
    $authorEmail: String!
    $content: String!
  ) {
    createComment(
      input: {
        commentOn: $commentOn
        author: $author
        authorEmail: $authorEmail
        content: $content
      }
    ) {
      success
    }
  }
`;

/** Conservative email check — enough to reject nonsense, not a validator. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}
