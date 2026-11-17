// Phone numbers are Ghanaian and written the local way: exactly 10 digits
// starting with 0, e.g. 0241234567. Shared by the forms and the API routes.

export const PHONE_DIGITS = 10;

/** Digits only, at most 10. "+233 24 123 4567" or "233241234567" becomes "0241234567". */
export function cleanPhone(input: string): string {
  let d = String(input ?? "").replace(/\D/g, "");
  if (d.startsWith("233") && d.length > PHONE_DIGITS) d = "0" + d.slice(3);
  return d.slice(0, PHONE_DIGITS);
}

/** Why a phone number isn't acceptable, or null when it is (an empty optional number is fine). */
export function phoneProblem(value: string, required = false): string | null {
  const d = String(value ?? "").replace(/\D/g, "");
  if (!d) return required ? "Enter a phone number." : null;
  if (!d.startsWith("0")) return "Start the number with 0, e.g. 0241234567.";
  if (d.length !== PHONE_DIGITS) return `A phone number has 10 digits. This one has ${d.length}.`;
  return null;
}

export const isValidPhone = (value: string) => phoneProblem(value, true) === null;

/** The phone numbers on a staff record, with the names HR sees for them */
export const STAFF_PHONE_FIELDS = [
  ["phone", "Phone"],
  ["nextOfKinPhone", "Next of kin phone"],
  ["nextOfKinAltPhone", "Next of kin other phone"],
  ["emergencyPhone", "Emergency contact phone"],
] as const;

/** Cleans each phone number in a request body in place; returns the first problem, if any */
export function cleanStaffPhones(body: Record<string, unknown>): string | null {
  for (const [key, label] of STAFF_PHONE_FIELDS) {
    if (typeof body[key] !== "string") continue;
    const clean = cleanPhone(body[key] as string);
    body[key] = clean;
    const problem = phoneProblem(clean);
    if (problem) return `${label}: ${problem}`;
  }
  return null;
}
