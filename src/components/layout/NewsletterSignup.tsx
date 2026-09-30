"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileDown, Loader2, Mail } from "lucide-react";
import { formatBytes, type NewsletterIssue } from "@/lib/wp-newsletter";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "done"; message: string } | { kind: "error"; message: string };

/** Footer sign-up: health tips and hospital news by email, plus the latest
 *  issue as a PDF when the admin portal has one set. */
export function NewsletterSignup({ latest = null }: { latest?: NewsletterIssue | null }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState(""); // honeypot — hidden from people
  const [state, setState] = useState<State>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    if (!email.trim()) return setState({ kind: "error", message: "Please enter your email address." });
    if (!consent) return setState({ kind: "error", message: "Please tick the box to agree to receive our emails." });
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), consent, website: trap }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn’t sign you up just now. Please try again later.");
      setState({ kind: "done", message: data.message || "Thank you, you’re on the list." });
      setEmail("");
      setConsent(false);
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  };

  return (
    <section className="fn-band" aria-labelledby={`${id}-title`}>
      <div className="fn-intro">
        <span className="fn-icon" aria-hidden="true">
          <Mail size={22} />
        </span>
        <div>
          <h2 id={`${id}-title`} className="fn-title">Stay informed</h2>
          <p className="fn-text">
            Health tips, clinic updates and hospital news from SECH, straight to your inbox. No spam.
          </p>
          {latest && (
            <a className="fn-issue" href={latest.url} target="_blank" rel="noopener noreferrer">
              <span className="fn-issue-icon" aria-hidden="true"><FileDown size={18} /></span>
              <span className="fn-issue-text">
                <strong>Read the latest newsletter</strong>
                <span>
                  {[latest.issue || latest.title, "PDF", formatBytes(latest.sizeBytes)].filter(Boolean).join(" · ")}
                </span>
              </span>
            </a>
          )}
        </div>
      </div>

      {state.kind === "done" ? (
        <div className="fn-done" role="status">
          <CheckCircle2 size={22} aria-hidden="true" />
          <div>
            <strong>{state.message}</strong>
            <span>Every email we send has a link to unsubscribe.</span>
          </div>
        </div>
      ) : (
        <form className="fn-form" onSubmit={submit} noValidate>
          <div className="fn-row">
            <label htmlFor={`${id}-email`} className="fn-sr">Email address</label>
            <input
              id={`${id}-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state.kind === "error") setState({ kind: "idle" });
              }}
              className="fn-input"
              aria-invalid={state.kind === "error" || undefined}
              aria-describedby={state.kind === "error" ? `${id}-err` : undefined}
              maxLength={190}
            />
            <button type="submit" className="fn-btn" disabled={state.kind === "sending"}>
              {state.kind === "sending" ? (
                <><Loader2 size={17} className="fn-spin" aria-hidden="true" />Subscribing…</>
              ) : (
                <>Subscribe<ArrowRight size={17} aria-hidden="true" /></>
              )}
            </button>
          </div>

          {/* Honeypot. Off-screen, skipped by keyboard and screen readers. */}
          <div className="fn-trap" aria-hidden="true">
            <label>
              Website
              <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </label>
          </div>

          <label className="fn-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (state.kind === "error") setState({ kind: "idle" });
              }}
            />
            <span>
              I agree to receive occasional emails from St. Elizabeth Catholic Hospital. I can unsubscribe at any time.
              See our <Link href="/disclaimer#newsletter">disclaimer and privacy notes</Link>.
            </span>
          </label>

          {state.kind === "error" && (
            <p id={`${id}-err`} className="fn-error" role="alert">{state.message}</p>
          )}
        </form>
      )}
    </section>
  );
}
