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
