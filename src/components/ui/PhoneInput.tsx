"use client";

import { useState } from "react";
import { cleanPhone, phoneProblem, PHONE_DIGITS } from "@/lib/phone";
import "@/styles/phone-input.css";

/**
 * A 10-digit phone field with feedback as you type: how many digits so far,
 * a tick when it's complete, and a clear message when it isn't. Letters and
 * spaces are dropped, and a +233 number is turned into the local 0… form.
 */
export function PhoneInput({
  value, onChange, required = false, id, name, className = "", placeholder = "0241234567",
  ariaLabel, ariaDescribedBy, autoComplete = "tel", disabled, forceShowError = false,
}: {
  value: string;
  onChange: (digits: string) => void;
  required?: boolean;
  id?: string;
  name?: string;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  autoComplete?: string;
  disabled?: boolean;
  /** show the problem straight away, e.g. after a failed submit */
  forceShowError?: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const [dropped, setDropped] = useState(false);
  const digits = cleanPhone(value);
  const problem = phoneProblem(digits, required);
  // a wrong first digit or a full-length wrong number is flagged at once; a short one only after leaving the field
  const wrongStart = digits.length > 0 && !digits.startsWith("0");
  const showError = !!problem && (wrongStart || digits.length === PHONE_DIGITS || ((touched || forceShowError) && (digits.length > 0 || forceShowError)));
  const done = digits.length === PHONE_DIGITS && !problem;
  const hintId = `${id ?? name ?? "phone"}-hint`;

  let state: "idle" | "typing" | "ok" | "error" = "idle";
  let message = `10 digits, e.g. ${placeholder}`;
  if (showError) { state = "error"; message = problem!; }
  else if (done) { state = "ok"; message = "Looks right"; }
  else if (digits.length > 0) { state = "typing"; message = `${digits.length} of 10 digits`; }
  if (dropped && state !== "error" && state !== "ok") message = "Numbers only. Letters and symbols were left out.";

  return (
    <span className="phin">
      <input
        id={id}
        name={name}
        className={className}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={digits}
        disabled={disabled}
        maxLength={PHONE_DIGITS + 8}
        aria-label={ariaLabel}
        aria-invalid={state === "error" || undefined}
        aria-describedby={[ariaDescribedBy, hintId].filter(Boolean).join(" ")}
        onChange={(e) => {
          const raw = e.target.value;
          const next = cleanPhone(raw);
          // tell them when something they typed was left out (but not for a pasted +233 number)
          setDropped(/[^\d\s+()-]/.test(raw));
          onChange(next);
        }}
        onBlur={() => setTouched(true)}
      />
      <span id={hintId} className="phin-hint" data-state={state} aria-live="polite">
        {state === "ok" && (
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
        {state === "error" && (
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 4.8v3.6M8 10.9v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        )}
        <span className="phin-msg">{message}</span>
        {state === "typing" && (
          <span className="phin-bar" aria-hidden="true"><span style={{ width: `${(digits.length / PHONE_DIGITS) * 100}%` }} /></span>
        )}
      </span>
    </span>
  );
}
