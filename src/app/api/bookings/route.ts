import { NextResponse } from "next/server";
import { wpGraphQL, toErrorResponse } from "@/lib/wp-graphql";
import { BOOKING_FIELDS, mapWpBooking, type WpBookingNode } from "@/lib/wp-bookings";

export const dynamic = "force-dynamic";

const LIST_BOOKINGS = `
  query AdminBookings($first: Int!) {
    bookings(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
      nodes { ${BOOKING_FIELDS} }
    }
  }
`;

/** Patient records — always authenticated, never cached. */
export async function GET() {
  try {
    const data = await wpGraphQL<{ bookings: { nodes: WpBookingNode[] } }>(
      LIST_BOOKINGS,
      { first: 200 },
      { authenticated: true },
    );
    return NextResponse.json({
      bookings: (data.bookings?.nodes ?? []).map(mapWpBooking),
    });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

const SUBMIT_BOOKING = `
  mutation SubmitBooking(
    $patientName: String!
    $phone: String!
    $email: String
    $dateOfBirth: String
    $gender: String
    $department: String!
    $appointmentType: String
    $preferredDate: String
    $preferredTime: String
    $insurance: String
    $insuranceNumber: String
    $notes: String
  ) {
    submitBooking(
      input: {
        patientName: $patientName
        phone: $phone
        email: $email
        dateOfBirth: $dateOfBirth
        gender: $gender
        department: $department
        appointmentType: $appointmentType
        preferredDate: $preferredDate
        preferredTime: $preferredTime
        insurance: $insurance
        insuranceNumber: $insuranceNumber
        notes: $notes
      }
    ) {
      reference
      databaseId
    }
  }
`;

/**
 * Public endpoint — this is what the patient-facing appointment form posts to.
 *
 * Unauthenticated by necessity (patients have no WordPress account), so the
 * write is gated on a shared secret that lives only on the server. The key is
 * never sent to the browser.
 */
export async function POST(request: Request) {
  try {
    const key = process.env.SECH_BOOKING_KEY;
    if (!key) {
      // Fail loudly rather than silently dropping a patient's booking.
      console.error("SECH_BOOKING_KEY is not set — booking submissions cannot be saved.");
      return NextResponse.json(
        { error: "Online booking is temporarily unavailable. Please call the hospital." },
        { status: 503 },
      );
    }

    const body = await request.json();

    const patientName = String(body.patientName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const department = String(body.department ?? "").trim();

    if (!patientName || !phone || !department) {
      return NextResponse.json(
        { error: "Name, phone number and department are required." },
        { status: 400 },
      );
    }

    const data = await wpGraphQL<{
      submitBooking: { reference: string; databaseId: number };
    }>(
      SUBMIT_BOOKING,
      {
        patientName,
        phone,
        email: String(body.email ?? "").trim(),
        dateOfBirth: String(body.dateOfBirth ?? "").trim(),
        gender: String(body.gender ?? "").trim(),
        department,
        appointmentType: String(body.appointmentType ?? "consultation").trim(),
        preferredDate: String(body.preferredDate ?? "").trim(),
        preferredTime: String(body.preferredTime ?? "").trim(),
        insurance: String(body.insurance ?? "").trim(),
        insuranceNumber: String(body.insuranceNumber ?? "").trim(),
        notes: String(body.notes ?? "").trim(),
      },
      { headers: { "X-SECH-BOOKING-KEY": key } },
    );

    return NextResponse.json({
      success: true,
      reference: data.submitBooking.reference,
    });
  } catch (error) {
    const { body, status } = toErrorResponse(error);
    // Never surface WordPress internals to a patient.
    return NextResponse.json(
      {
        error:
          status >= 500
            ? "We could not save your booking. Please call the hospital."
            : body.error,
      },
      { status },
    );
  }
}
