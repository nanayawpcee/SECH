/** Contact-form messages — shapes, labels and GraphQL documents (plugin 1.5.0+). */

/** The contact form is for short enquiries; longer ones go to the hospital's email. */
export const MESSAGE_MAX = 500;

export type MessageTopic =
  | "general" | "appointments" | "feedback" | "complaint" | "billing" | "records" | "media" | "other";

/** In the order the form offers them. The plugin validates against the same keys. */
export const MESSAGE_TOPICS: { value: MessageTopic; label: string }[] = [
  { value: "general", label: "General enquiry" },
  { value: "appointments", label: "Appointments" },
  { value: "feedback", label: "Feedback or compliment" },
  { value: "complaint", label: "Complaint" },
  { value: "billing", label: "Billing and insurance (NHIS)" },
  { value: "records", label: "Medical records and reports" },
  { value: "media", label: "Media, partnerships and donations" },
  { value: "other", label: "Something else" },
];

export const topicLabel = (t: string) => MESSAGE_TOPICS.find((x) => x.value === t)?.label ?? "General enquiry";

export interface ContactMessage {
  databaseId: number;
  reference: string;
  name: string;
  email: string | null;
  phone: string | null;
  topic: MessageTopic;
  message: string;
  status: "new" | "read" | "done";
  createdAt: string;
}

const FIELDS = "databaseId reference name email phone topic message status createdAt";

export const MESSAGES_QUERY = `query ContactMessages { contactMessages { ${FIELDS} } }`;

export const SUBMIT_MESSAGE = `
  mutation SubmitContactMessage($name: String!, $email: String, $phone: String, $topic: String, $message: String!) {
    submitContactMessage(input: { name: $name, email: $email, phone: $phone, topic: $topic, message: $message }) {
      reference
    }
  }
`;

export const UPDATE_MESSAGE = `
  mutation UpdateContactMessage($id: Int!, $status: String!) {
    updateContactMessage(input: { id: $id, status: $status }) { message { ${FIELDS} } }
  }
`;

export const DELETE_MESSAGE = `
  mutation DeleteContactMessage($id: Int!) {
    deleteContactMessage(input: { id: $id }) { ok }
  }
`;

/** WordPress is still on a plugin older than 1.5.0. */
export function isMissingMessagesPlugin(message: string) {
  return /contactMessages|submitContactMessage|updateContactMessage|deleteContactMessage/i.test(message);
}
