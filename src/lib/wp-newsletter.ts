/** Newsletter list — GraphQL documents and shapes (plugin 1.4.0+). */

export interface NewsletterSubscriber {
  databaseId: number;
  email: string;
  name: string | null;
  status: "subscribed" | "unsubscribed";
  source: string | null;
  subscribedAt: string | null;
  unsubscribedAt: string | null;
  unsubscribeToken: string;
}

export const SUBSCRIBERS_QUERY = `
  query NewsletterSubscribers {
    newsletterSubscribers {
      databaseId email name status source subscribedAt unsubscribedAt unsubscribeToken
    }
  }
`;

export const SUBSCRIBE = `
  mutation SubscribeNewsletter($email: String!, $name: String, $source: String) {
    subscribeNewsletter(input: { email: $email, name: $name, source: $source }) { ok }
  }
`;

export const UNSUBSCRIBE = `
  mutation UnsubscribeNewsletter($token: String!) {
    unsubscribeNewsletter(input: { token: $token }) { ok }
  }
`;

export const DELETE_SUBSCRIBER = `
  mutation DeleteNewsletterSubscriber($id: Int!) {
    deleteNewsletterSubscriber(input: { id: $id }) { ok }
  }
`;

/** WordPress is still on a plugin older than 1.4.0. */
export function isMissingNewsletterPlugin(message: string) {
  return /newsletterSubscribers|subscribeNewsletter|unsubscribeNewsletter|deleteNewsletterSubscriber/i.test(message);
}

/** Same shape check the browser does, so bad input never reaches WordPress. */
export function isPlausibleEmail(email: string) {
  return email.length <= 190 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(email);
}

/* ── Current issue: the downloadable newsletter PDF (plugin 1.6.0+) ── */

export interface NewsletterIssue {
  title: string;
  issue: string | null;
  url: string;
  sizeBytes: number | null;
  attachmentId: number;
  updatedAt: string | null;
}

export interface NewsletterPdf {
  attachmentId: number;
  fileName: string;
  title: string;
  url: string;
  sizeBytes: number | null;
  uploadedAt: string;
}

const ISSUE_FIELDS = "title issue url sizeBytes attachmentId updatedAt";

export const CURRENT_NEWSLETTER_QUERY = `query CurrentNewsletter { currentNewsletter { ${ISSUE_FIELDS} } }`;

export const NEWSLETTER_ADMIN_QUERY = `
  query NewsletterIssueAdmin {
    currentNewsletter { ${ISSUE_FIELDS} }
    newsletterPdfs { attachmentId fileName title url sizeBytes uploadedAt }
  }
`;

export const SET_CURRENT_NEWSLETTER = `
  mutation SetCurrentNewsletter($attachmentId: Int!, $title: String!, $issue: String) {
    setCurrentNewsletter(input: { attachmentId: $attachmentId, title: $title, issue: $issue }) {
      newsletter { ${ISSUE_FIELDS} }
    }
  }
`;

export const CLEAR_CURRENT_NEWSLETTER = `mutation ClearCurrentNewsletter { clearCurrentNewsletter(input: {}) { ok } }`;

export function isMissingIssuePlugin(message: string) {
  return /currentNewsletter|newsletterPdfs|setCurrentNewsletter|clearCurrentNewsletter/i.test(message);
}

/** "3.2 MB" — for the download link, so people on mobile data know what they're getting. */
export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
