/**
 * Shared submit for the two patient-facing appointment forms (the full page
 * and the modal). Both collect the same fields, so the mapping to the API
 * lives here rather than being duplicated and drifting apart.
 */

import posthog from "posthog-js";

export interface AppointmentFormValues {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  department: string;
  appointmentType: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  hasInsurance: boolean;
  insuranceName: string;
  insuranceNumber: string;
}

interface AppointmentSubmission {
  patientName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  department: string;
  appointmentType: string;
  preferredDate: string;
  preferredTime: string;
  insurance: string;
  insuranceNumber: string;
  notes: string;
}

const toAppointmentSubmission = (data: AppointmentFormValues): AppointmentSubmission => ({
  patientName: `${data.firstName} ${data.lastName}`.trim(),
  phone: data.phone,
  email: data.email,
  dateOfBirth: data.dob,
  gender: data.gender,
  department: data.department,
  appointmentType: data.appointmentType,
  preferredDate: data.preferredDate,
  preferredTime: data.preferredTime,
  insurance: data.hasInsurance ? data.insuranceName : "",
  insuranceNumber: data.hasInsurance ? data.insuranceNumber : "",
  notes: data.notes,
});

export interface BookingResult {
  ok: boolean;
  reference?: string;
  error?: string;
}

export async function submitAppointment(
  data: AppointmentFormValues,
): Promise<BookingResult> {
  try {
    const submission = toAppointmentSubmission(data);
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: result?.error || "We could not save your booking. Please call the hospital.",
      };
    }

    if (posthog.__loaded) {
      posthog.capture("appointment_booking_submitted", {
        department: data.department,
        appointment_type: data.appointmentType,
        has_insurance: data.hasInsurance,
      });
    }

    return { ok: true, reference: result.reference };
  } catch {
    return {
      ok: false,
      error: "No connection. Please check your network, or call the hospital.",
    };
  }
}
