export interface Post {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  type: "news" | "blog" | "event" | "announcement";
  author: string;
  date: string;
  /** "pending" = submitted by a staff writer, waiting for an admin to publish. */
  status: "published" | "draft" | "scheduled" | "pending";
  slug: string;
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  dept: string;
  type: "consultation" | "followup" | "test";
  date: string;
  time: string;
  insurance: string;
  insuranceNumber?: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

