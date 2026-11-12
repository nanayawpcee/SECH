"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2, MailCheck, UserRound } from "lucide-react";
import { AuthCard } from "@/components/admin/AuthCard";

export default function ForgotPasswordPage() {
  const [login, setLogin] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = login.trim();
    if (!value) {
      setError("Enter your username or email address.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", login: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setSentTo(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCard
        title="Check your email"
        sub={<>If <strong>{sentTo}</strong> belongs to a staff account with an email address, we’ve sent it a link to choose a new password. The link works once and lasts 24 hours.</>}
        foot={<>No email after a few minutes? Check your spam folder. If your account has no email address, ask an administrator to give you a temporary password.</>}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <Link href="/admin/login" className="po-btn po-btn--primary ac-submit"><MailCheck size={17} />Back to sign in</Link>
          <button type="button" className="po-btn po-btn--ghost" style={{ justifyContent: "center" }} onClick={() => { setSentTo(""); setLogin(""); }}>
            Try a different username or email
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      sub="Enter the username or email address you sign in with, and we’ll email you a link to choose a new password."
      foot={<>Staff without an email address on their account can’t reset it here. Ask an administrator to give you a temporary password.</>}
    >
      {error && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 14 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
        </div>
      )}
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 16 }}>
        <label className="po-field">
          <span className="po-label">Username or email</span>
          <div className="po-input-wrap">
            <UserRound size={16} />
            <input className="po-input ac-input" value={login} onChange={(e) => setLogin(e.target.value)}
              autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus maxLength={100} />
          </div>
        </label>
        <button type="submit" className="po-btn po-btn--primary ac-submit" disabled={sending}>
          {sending ? <><Loader2 size={17} className="po-spin" />Sending…</> : <>Email me a link<ArrowRight size={17} /></>}
        </button>
      </form>
    </AuthCard>
  );
}
