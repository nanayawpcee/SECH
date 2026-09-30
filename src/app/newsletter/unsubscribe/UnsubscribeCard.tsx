"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, MailX } from "lucide-react";
import { SITE } from "@/lib/data";

type State = "ready" | "sending" | "done" | "error";

export function UnsubscribeCard({ token }: { token: string }) {
  const [state, setState] = useState<State>(token.length >= 20 ? "ready" : "error");
  const [message, setMessage] = useState(token ? "This unsubscribe link is not valid." : "This page needs the link from one of our emails.");

  const unsubscribe = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "This isn’t working right now.");
      setState("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "This isn’t working right now.");
      setState("error");
    }
  };

  const mail = <a href={`mailto:${SITE.email}?subject=Unsubscribe`}>{SITE.email}</a>;

  if (state === "done") {
    return (
      <div className="lg-card" role="status">
        <span className="lg-card-icon" data-tone="done"><CheckCircle2 size={28} aria-hidden="true" /></span>
        <h1>You’ve been unsubscribed</h1>
        <p>You won’t receive any more newsletter emails from us. You can sign up again at any time from the bottom of any page.</p>
        <Link href="/" className="lg-btn">Back to the website</Link>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="lg-card" role="alert">
        <span className="lg-card-icon" data-tone="error"><AlertTriangle size={28} aria-hidden="true" /></span>
        <h1>We couldn’t unsubscribe you</h1>
        <p>{message}</p>
        <p>Email {mail} and we’ll take you off the list.</p>
      </div>
    );
  }

  return (
    <div className="lg-card">
      <span className="lg-card-icon"><MailX size={28} aria-hidden="true" /></span>
      <h1>Unsubscribe from our newsletter?</h1>
      <p>You’ll stop receiving health tips and hospital news from {SITE.name} by email.</p>
      <button type="button" className="lg-btn" onClick={unsubscribe} disabled={state === "sending"}>
        {state === "sending" ? <><Loader2 size={16} className="fn-spin" aria-hidden="true" />Unsubscribing…</> : "Yes, unsubscribe me"}
      </button>
      <Link href="/">No, take me back to the website</Link>
    </div>
  );
}
