/** A rough strength score, only to guide — WordPress enforces its own rules. */
export function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length < 12) score = Math.min(score, 1);
  const levels = [
    { label: "Too short", tone: "danger" },
    { label: "Weak", tone: "danger" },
    { label: "Fair", tone: "warn" },
    { label: "Good", tone: "info" },
    { label: "Strong", tone: "success" },
    { label: "Very strong", tone: "success" },
  ];
  return { score, ...levels[score] };
}
