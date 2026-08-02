"use client";

import { submitAppointment } from "@/lib/submit-booking";
import { useState } from "react";
import { DEPARTMENTS } from "@/lib/data";

type Step = "personal" | "appointment" | "review" | "success";

interface FormData {
  firstName: string; lastName: string; dob: string; gender: string;
  phone: string; email: string; department: string; appointmentType: string;
  preferredDate: string; preferredTime: string; notes: string;
  hasInsurance: boolean; insuranceName: string; insuranceNumber: string;
}

const INITIAL: FormData = {
  firstName: "", lastName: "", dob: "", gender: "", phone: "", email: "",
  department: "", appointmentType: "consultation", preferredDate: "",
  preferredTime: "", notes: "", hasInsurance: false, insuranceName: "", insuranceNumber: "",
};

const TIMES = [
  "08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM","04:30 PM",
];

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: "personal",    label: "Personal Info", icon: "👤" },
  { key: "appointment", label: "Appointment",   icon: "📅" },
  { key: "review",      label: "Review",        icon: "✅" },
];

function validate(step: Step, data: FormData) {
  const errors: Record<string, string> = {};
  if (step === "personal") {
    if (!data.firstName.trim()) errors.firstName = "Required";
    if (!data.lastName.trim())  errors.lastName  = "Required";
    if (!data.phone.trim())     errors.phone     = "Required";
    if (!data.gender)           errors.gender    = "Required";
  }
  if (step === "appointment") {
    if (!data.department)    errors.department    = "Please select a department";
    if (!data.preferredDate) errors.preferredDate = "Please choose a date";
    if (!data.preferredTime) errors.preferredTime = "Please choose a time";
  }
  return errors;
}

export function AppointmentPageForm() {
  const [step, setStep]     = useState<Step>("personal");
  const [data, setData]     = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const set = (field: keyof FormData, value: string | boolean) =>
    setData(p => ({ ...p, [field]: value }));

  const next = () => {
    const errs = validate(step, data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (step === "personal")    setStep("appointment");
    else if (step === "appointment") setStep("review");
  };

  const back = () => {
    if (step === "appointment") setStep("personal");
    if (step === "review")      setStep("appointment");
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitAppointment(data);
    setSubmitting(false);
    if (!result.ok) {
      // Keep the patient on the review step with their details intact.
      setSubmitError(result.error ?? "Something went wrong.");
      return;
    }
    setReference(result.reference ?? null);
    setStep("success");
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const stepIndex = STEPS.findIndex(s => s.key === step);

  return (
    <div>
      {/* Step indicator */}
      {step !== "success" && (
        <div style={{ display: "flex", marginBottom: "2rem" }}>
          {STEPS.map((s, i) => (
            <div key={s.key} style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: "0 0 auto" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: i <= stepIndex ? "var(--primary)" : "#E2EBE7",
                  color: i <= stepIndex ? "#fff" : "var(--text-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: i < stepIndex ? 18 : 15, fontWeight: 700,
                  border: i === stepIndex ? "2.5px solid var(--accent)" : "2.5px solid transparent",
                  transition: "all 0.3s",
                }}>
                  {i < stepIndex ? "✓" : s.icon}
                </div>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: i <= stepIndex ? "var(--primary)" : "var(--text-light)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < stepIndex ? "var(--primary)" : "#E2EBE7", margin: "0 6px", marginBottom: 22, transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── STEP 1 ── */}
      {step === "personal" && (
        <div style={{ animation: "slideUp 0.3s ease" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1.4rem", color: "var(--text-dark)" }}>
            Personal Information
          </h3>
          
          {/* First & Last Name row */}
          <div className="contact-name-grid">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" placeholder="e.g. Kwame" value={data.firstName} onChange={e => set("firstName", e.target.value)} />
              {errors.firstName && <p className="form-error">{errors.firstName}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" placeholder="e.g. Asante" value={data.lastName} onChange={e => set("lastName", e.target.value)} />
              {errors.lastName && <p className="form-error">{errors.lastName}</p>}
            </div>
          </div>

          {/* DOB & Gender row */}
          <div className="contact-name-grid">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-input" type="date" value={data.dob} onChange={e => set("dob", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select className="form-select" value={data.gender} onChange={e => set("gender", e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
              {errors.gender && <p className="form-error">{errors.gender}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input className="form-input" placeholder="+233 XX XXX XXXX" value={data.phone} onChange={e => set("phone", e.target.value)} />
            {errors.phone && <p className="form-error">{errors.phone}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Email (optional)</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={data.email} onChange={e => set("email", e.target.value)} />
          </div>
          <div style={{ background: "var(--light-green)", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem", marginTop: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div onClick={() => set("hasInsurance", !data.hasInsurance)} style={{ width: 44, height: 24, borderRadius: 12, background: data.hasInsurance ? "var(--primary)" : "#C8DCCE", position: "relative", transition: "background 0.2s", flexShrink: 0, cursor: "pointer" }}>
                <div style={{ position: "absolute", top: 3, left: data.hasInsurance ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-mid)" }}>I have health insurance (NHIS or private)</span>
            </label>
            {data.hasInsurance && (
              /* Insurance grid wrapper */
              <div className="contact-name-grid" style={{ marginTop: "0.85rem", animation: "slideUp 0.25s ease" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Insurance Provider</label>
                  <input className="form-input" placeholder="e.g. NHIS" value={data.insuranceName} onChange={e => set("insuranceName", e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Membership Number</label>
                  <input className="form-input" placeholder="e.g. GH-12345678" value={data.insuranceNumber} onChange={e => set("insuranceNumber", e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === "appointment" && (
        <div style={{ animation: "slideUp 0.3s ease" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1.4rem", color: "var(--text-dark)" }}>Appointment Details</h3>
          <div className="form-group">
            <label className="form-label">Department *</label>
            <select className="form-select" value={data.department} onChange={e => set("department", e.target.value)}>
              <option value="">Select a department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="form-error">{errors.department}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Appointment Type</label>
            {/* Added flexWrap and dynamic flex bases so option boxes stack gracefully on mobile screens */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { value: "consultation", label: "New Consultation", icon: "🩺" },
                { value: "followup",     label: "Follow-Up",        icon: "🔄" },
                { value: "test",         label: "Test / Lab",       icon: "🔬" },
              ].map(opt => (
                <label key={opt.value} style={{ flex: "1 1 140px", padding: "10px", border: `1.5px solid ${data.appointmentType === opt.value ? "var(--primary)" : "#D6E8DF"}`, borderRadius: "var(--radius-sm)", cursor: "pointer", textAlign: "center", background: data.appointmentType === opt.value ? "var(--light-green)" : "#fff", transition: "all 0.2s" }}>
                  <input type="radio" name="apptType" value={opt.value} checked={data.appointmentType === opt.value} onChange={() => set("appointmentType", opt.value)} style={{ display: "none" }} />
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                  <div style={{ fontSize: "0.74rem", fontWeight: 700, color: data.appointmentType === opt.value ? "var(--primary)" : "var(--text-light)", letterSpacing: "0.04em" }}>{opt.label}</div>
                </label>
              ))}
            </div>
          </div>
          
          {/* Preferred Date & Time row */}
          <div className="contact-name-grid">
            <div className="form-group">
              <label className="form-label">Preferred Date *</label>
              <input className="form-input" type="date" min={minDate} value={data.preferredDate} onChange={e => set("preferredDate", e.target.value)} />
              {errors.preferredDate && <p className="form-error">{errors.preferredDate}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Time *</label>
              <select className="form-select" value={data.preferredTime} onChange={e => set("preferredTime", e.target.value)}>
                <option value="">Select time</option>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.preferredTime && <p className="form-error">{errors.preferredTime}</p>}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Additional Notes (optional)</label>
            <textarea className="form-input" rows={3} placeholder="Briefly describe your concern…" value={data.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical" }} />
          </div>
        </div>
      )}

      {/* ── STEP 3: Review ── */}
      {step === "review" && (
        <div style={{ animation: "slideUp 0.3s ease" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1.4rem", color: "var(--text-dark)" }}>Review Your Booking</h3>
          {[
            { title: "Personal Information", rows: [["Name", `${data.firstName} ${data.lastName}`], ["Gender", data.gender || "—"], ["DOB", data.dob || "—"], ["Phone", data.phone], ["Email", data.email || "—"], ...(data.hasInsurance ? [["Insurance", `${data.insuranceName} · ${data.insuranceNumber}`]] : [])] },
            { title: "Appointment Details",  rows: [["Department", data.department], ["Type", data.appointmentType], ["Date", data.preferredDate], ["Time", data.preferredTime], ...(data.notes ? [["Notes", data.notes]] : [])] },
          ].map(section => (
            <div key={section.title} style={{ background: "var(--off-white)", borderRadius: "var(--radius-md)", padding: "1.1rem 1.25rem", marginBottom: "1rem", border: "1px solid #E2EBE7" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--primary-light)", marginBottom: "0.75rem" }}>{section.title}</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {section.rows.map(([label, val]) => (
                    <tr key={label} style={{ borderBottom: "1px solid #E2EBE7" }}>
                      <td style={{ padding: "6px 0", fontSize: "0.82rem", color: "var(--text-light)", width: "38%", fontWeight: 600 }}>{label}</td>
                      <td style={{ padding: "6px 0", fontSize: "0.88rem", color: "var(--text-dark)", fontWeight: 500, textTransform: label === "Type" ? "capitalize" : "none" }}>{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div style={{ background: "#FFF8E8", border: "1px solid #F5D080", borderRadius: "var(--radius-sm)", padding: "0.85rem 1rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
            <p style={{ fontSize: "0.8rem", color: "#6B5E2B", lineHeight: 1.55, margin: 0 }}>
              We'll call <strong>{data.phone}</strong> within 24 hours to confirm. Please bring a valid ID and any previous medical records.
            </p>
          </div>
        </div>
      )}

      {/* ── SUCCESS ── */}
      {step === "success" && (
        <div style={{ textAlign: "center", padding: "3rem 1rem", animation: "slideUp 0.4s ease" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--light-green)", border: "3px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 1.5rem" }}>✓</div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.7rem", fontWeight: 800, color: "var(--text-dark)", margin: "0 0 12px" }}>Booking Request Sent!</h2>
          <p style={{ color: "var(--text-light)", lineHeight: 1.72, maxWidth: 420, margin: "0 auto 2rem" }}>
            Thank you, <strong>{data.firstName}</strong>. Your appointment request for <strong>{data.department}</strong> on <strong>{data.preferredDate}</strong> has been received. We'll call <strong>{data.phone}</strong> within 24 hours.
          </p>
          <button className="btn-outline" onClick={() => { setStep("personal"); setData(INITIAL); }}>
            Book Another Appointment
          </button>
        </div>
      )}

      {/* Nav buttons */}
      {step !== "success" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #E2EBE7" }}>
          <button
            onClick={back}
            disabled={step === "personal"}
            style={{ padding: "11px 24px", background: "none", border: "1.5px solid #C0D8CC", borderRadius: "var(--radius-sm)", color: step === "personal" ? "#C0D8CC" : "var(--text-mid)", fontWeight: 600, fontSize: "0.88rem", cursor: step === "personal" ? "default" : "pointer", transition: "all 0.2s" }}
          >
            ← Back
          </button>
{submitError && (
            <div
              role="alert"
              style={{
                flexBasis: "100%",
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                color: "#B91C1C",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: "0.85rem",
                lineHeight: 1.5,
              }}
            >
              {submitError}
            </div>
          )}
          {step !== "review" ? (
            <button className="btn-accent" onClick={next}>Continue →</button>
          ) : (
            <button className="btn-accent" onClick={submit} disabled={submitting} style={{ opacity: submitting ? 0.8 : 1, minWidth: 160, justifyContent: "center" }}>
              {submitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(13,31,26,0.3)", borderTopColor: "var(--text-dark)", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Submitting…
                </span>
              ) : "Confirm Booking ✓"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}