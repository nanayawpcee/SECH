"use client";

import "@/styles/contact.css";
import { useId, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/data";
import { MESSAGE_MAX, MESSAGE_TOPICS, type MessageTopic } from "@/lib/wp-messages";

const EMPTY = { name: "", phone: "", email: "", topic: "general" as MessageTopic, message: "" };
const MAX = MESSAGE_MAX;

type Errors = Partial<Record<keyof typeof EMPTY | "contact", string>>;

function validate(f: typeof EMPTY): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = "Please tell us your name.";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Please check your email address.";
  if (!f.email.trim() && !f.phone.trim()) e.contact = "Give an email address or phone number so we can reply.";
  if (f.message.trim().length < 5) e.message = "Please write your message.";
  return e;
}

/**
 * "Send a message" — saved to the hospital's inbox in the admin portal.
 * `theme` matches the surface it sits on: the dark homepage band or the
 * light contact page. `compact` trims it to fit beside other content.
 */
export function ContactForm({ theme = "light", compact = false }: { theme?: "light" | "dark"; compact?: boolean }) {
  const id = useId();
  const [form, setForm] = useState(EMPTY);
  const [trap, setTrap] = useState(""); // honeypot — hidden from people
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState<{ reference: string | null; replyTo: string } | null>(null);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key] || (errors.contact && (key === "email" || key === "phone"))) {
      setErrors((e) => ({ ...e, [key]: undefined, contact: key === "email" || key === "phone" ? undefined : e.contact }));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const found = validate(form);
    setErrors(found);
    setServerError("");
    if (Object.values(found).some(Boolean)) return;
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website: trap }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn’t send your message just now. Please call the hospital instead.");
      setSent({ reference: data.reference ?? null, replyTo: form.email.trim() || form.phone.trim() });
      setForm(EMPTY);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="ct-form" data-theme={theme} data-compact={compact || undefined}>
        <div className="ct-sent" role="status">
          <span className="ct-sent-icon"><CheckCircle2 size={30} aria-hidden="true" /></span>
          <h3>Message received</h3>
          <p>
            Thank you. Our team will reply to <strong>{sent.replyTo}</strong>, usually within one working day.
          </p>
          {sent.reference && <p className="ct-ref">Reference: <strong>{sent.reference}</strong></p>}
          <button type="button" className="ct-btn ct-btn--ghost" onClick={() => setSent(null)}>Send another message</button>
        </div>
      </div>
    );
  }

  const field = (key: keyof typeof EMPTY) => ({
    id: `${id}-${key}`,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${id}-${key}-err` : undefined,
  });
  const err = (key: keyof Errors) =>
    errors[key] ? <p id={`${id}-${key}-err`} className="ct-error">{errors[key]}</p> : null;

  return (
    <form className="ct-form" data-theme={theme} data-compact={compact || undefined} onSubmit={submit} noValidate>
      <h3 className="ct-form-title">Send us a message</h3>
      {!compact && <p className="ct-form-sub">For general enquiries, feedback and requests. We reply during working hours.</p>}

      <div className="ct-grid">
        <div className="ct-field">
          <label htmlFor={`${id}-name`}>Full name</label>
          <input {...field("name")} className="ct-input" autoComplete="name" value={form.name} maxLength={80}
            onChange={(e) => set("name", e.target.value)} />
          {err("name")}
        </div>
        <div className="ct-field">
          <label htmlFor={`${id}-topic`}>What is it about?</label>
          <select {...field("topic")} className="ct-input" value={form.topic}
            onChange={(e) => set("topic", e.target.value as MessageTopic)}>
            {MESSAGE_TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="ct-field">
          <label htmlFor={`${id}-phone`}>Phone <span className="ct-opt">(optional)</span></label>
          <input {...field("phone")} className="ct-input" type="tel" inputMode="tel" autoComplete="tel" value={form.phone}
            maxLength={30} onChange={(e) => set("phone", e.target.value)} aria-invalid={errors.contact ? true : undefined} />
        </div>
        <div className="ct-field">
          <label htmlFor={`${id}-email`}>Email <span className="ct-opt">(optional)</span></label>
          <input {...field("email")} className="ct-input" type="email" inputMode="email" autoComplete="email" value={form.email}
            maxLength={190} onChange={(e) => set("email", e.target.value)} aria-invalid={errors.email || errors.contact ? true : undefined} />
          {err("email")}
        </div>
      </div>
      {err("contact")}

      <div className="ct-field">
        <label htmlFor={`${id}-message`}>Your message</label>
        <textarea {...field("message")} className="ct-input ct-textarea" rows={compact ? 3 : 5} value={form.message} maxLength={MAX}
          onChange={(e) => set("message", e.target.value)} />
        <div className="ct-under">
          {err("message") ?? (
            <span className="ct-hint">
              {form.message.length >= MAX ? "That’s the limit. " : "Keep it short. "}
              For longer enquiries, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
            </span>
          )}
          <span
            className="ct-count"
            data-state={form.message.length >= MAX ? "full" : form.message.length >= MAX - 50 ? "near" : undefined}
            aria-live={form.message.length >= MAX - 50 ? "polite" : "off"}
          >
            {form.message.length}/{MAX}
          </span>
        </div>
      </div>

      {/* Honeypot. Off-screen, skipped by keyboard and screen readers. */}
      <div className="ct-trap" aria-hidden="true">
        <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} /></label>
      </div>

      <p className="ct-privacy">
        <ShieldCheck size={16} aria-hidden="true" />
        {compact ? (
          <span>
            No medical details, please. Emergencies: call{" "}
            <a href={`tel:${SITE.phone.replace(/\s+/g, "")}`}>{SITE.phone.trim()}</a>.{" "}
            <a href="/disclaimer#personal-information">Privacy</a>
          </span>
        ) : (
          <span>
            Please don’t include detailed medical information. In an emergency, call{" "}
            <a href={`tel:${SITE.phone.replace(/\s+/g, "")}`}>{SITE.phone.trim()}</a>. See how we use your details in our{" "}
            <a href="/disclaimer#personal-information">privacy notes</a>.
          </span>
        )}
      </p>

      {serverError && (
        <div className="ct-alert" role="alert">
          <AlertTriangle size={17} aria-hidden="true" /><span>{serverError}</span>
        </div>
      )}

      <button type="submit" className="ct-btn" disabled={sending}>
        {sending ? <><Loader2 size={17} className="ct-spin" aria-hidden="true" />Sending…</> : <>Send message<Send size={16} aria-hidden="true" /></>}
      </button>
    </form>
  );
}
