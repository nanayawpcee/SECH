import type { Booking } from "@/app/admin/data";

export interface WpBookingNode {
  databaseId: number;
  reference: string | null;
  date: string | null;
  patientName: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  department: string | null;
  appointmentType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  insurance: string | null;
  insuranceNumber: string | null;
  notes: string | null;
  bookingStatus: string | null;
}

export const BOOKING_FIELDS = `
  databaseId
  reference
  date
  patientName
  phone
  email
  dateOfBirth
  gender
  department
  appointmentType
  preferredDate
  preferredTime
  insurance
  insuranceNumber
  notes
  bookingStatus
`;

const TYPES: Booking["type"][] = ["consultation", "followup", "test"];
const STATUSES: Booking["status"][] = ["pending", "confirmed", "cancelled"];

/** Booking plus the numeric id the status mutation needs. */
export type AdminBooking = Booking & {
  databaseId: number;
  dateOfBirth?: string;
  gender?: string;
  /** Raw YYYY-MM-DD, kept so the calendar can group by day without reparsing
   *  the localised display string. */
  preferredDateISO: string;
};

export function mapWpBooking(node: WpBookingNode): AdminBooking {
  const type = TYPES.includes(node.appointmentType as Booking["type"])
    ? (node.appointmentType as Booking["type"])
    : "consultation";

  const status = STATUSES.includes(node.bookingStatus as Booking["status"])
    ? (node.bookingStatus as Booking["status"])
    : "pending";

  return {
    databaseId: node.databaseId,
    id: node.reference ?? `BK-${node.databaseId}`,
    name: node.patientName ?? "Unknown",
    phone: node.phone ?? "",
    email: node.email ?? "",
    dateOfBirth: node.dateOfBirth ?? "",
    gender: node.gender ?? "",
    dept: node.department ?? "",
    type,
    preferredDateISO: node.preferredDate ?? "",
    // Patients pick an ISO date; render it the way the admin tables expect.
    date: node.preferredDate
      ? new Date(node.preferredDate + "T00:00:00").toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "",
    time: node.preferredTime ?? "",
    insurance: node.insurance || "None",
    insuranceNumber: node.insuranceNumber ?? "",
    notes: node.notes ?? "",
    status,
    createdAt: node.date ? new Date(node.date).toLocaleDateString("en-GB") : "",
  };
}
