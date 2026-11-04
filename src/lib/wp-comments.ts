import "server-only";
import sanitizeHtml from "sanitize-html";

export interface PublicComment {
  id: string;
  author: string;
  content: string;
  date: string;
}

interface WpCommentNode {
  id: string;
  date: string | null;
  content: string | null;
  author: { node: { name: string | null } | null } | null;
}

// visitor input is stored and shown as plain text only, never as HTML
export function toPlainText(input: string, maxLength = 2000): string {
  const stripped = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    nonTextTags: ["style", "script", "textarea", "option", "noscript"],
    disallowedTagsMode: "discard",
  });

  const decoded = stripped
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&"); // keep last, or "&amp;lt;" decodes to "<"

  return decoded
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

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

// no author email here, it must never reach the browser
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

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}
