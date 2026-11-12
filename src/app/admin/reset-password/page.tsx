"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/admin/AuthCard";
import { passwordStrength } from "@/lib/password-strength";

type ResetLink = { key: string; login: string };
type Stage =
  | { kind: "checking" }
  | { kind: "bad"; message: string }
  | { kind: "form"; firstName: string; username: string }
  | { kind: "done"; username: string };

async function call(body: Record<string, string>) {
  const res = await fetch("/api/auth/password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export default function ResetPasswordPage() {
  const [link, setLink] = useState<ResetLink | null>(null);
  const started = useRef(false);
  const [stage, setStage] = useState<Stage>({ kind: "checking" });
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // read the link once, then take it out of the address bar and history
  useEffect(() => {
    // once only: the link is gone from the address bar after the first read
    if (started.current) return;
    started.current = true;
    const q = new URLSearchParams(window.location.search);
    const found = { key: q.get("key") ?? "", login: q.get("login") ?? "" };
    if (q.has("key")) window.history.replaceState(null, "", window.location.pathname);
    if (!found.key || !found.login) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStage({ kind: "bad", message: "This link is incomplete. Ask for a new one below." });
      return;
    }
    setLink(found);
    call({ action: "check", ...found })
      .then((d) => setStage({ kind: "form", firstName: d.firstName || "there", username: d.username || found.login }))
      .catch((err: Error) => setStage({ kind: "bad", message: err.message }));
  }, []);

  const s = useMemo(() => passwordStrength(next), [next]);
  const mismatch = confirm.length > 0 && confirm !== next;
  const ready = next.length >= 12 && next === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || !link) return;
    setSaving(true);
    setError("");
    try {
      const d = await call({ action: "reset", ...link, password: next });
      setNext("");
      setConfirm("");
      setStage({ kind: "done", username: d.username || link.login });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not set your password.";
      // an expired or used link can't be retried from this form
      if (/link/i.test(message)) setStage({ kind: "bad", message });
      else setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (stage.kind === "checking") {
    return (
      <AuthCard title="Choose a new password">
        <p className="ac-sub" style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 0 }}>
          <Loader2 size={16} className="po-spin" />Checking your link…
        </p>
      </AuthCard>
    );
  }

  if (stage.kind === "bad") {
    return (
      <AuthCard title="This link can’t be used" sub={stage.message}>
        <Link href="/admin/forgot-password" className="po-btn po-btn--primary ac-submit">Email me a new link<ArrowRight size={17} /></Link>
      </AuthCard>
    );
  }

  if (stage.kind === "done") {
    return (
      <AuthCard
        title="Your password is set"
        sub={<>You can now sign in with your new password. Any device that was signed in to your account has been signed out.</>}
      >
        <div className="po-alert po-tone-success" role="status" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>Username: <strong>{stage.username}</strong></span>
        </div>
        <Link href="/admin/login" className="po-btn po-btn--primary ac-submit">Sign in<ArrowRight size={17} /></Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={`Hello, ${stage.firstName}`}
      sub="Choose a new password for your staff portal account. It’s the only one you’ll use from here on, and nobody else will know it."
    >
      {error && (
        <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 14 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
        </div>
      )}
      <form onSubmit={submit} noValidate style={{ display: "grid", gap: 14 }}>
        {/* lets password managers save the new password against the right account */}
        <input type="text" name="username" autoComplete="username" value={stage.username} readOnly hidden />

        <label className="po-field">
          <span className="po-label">New password</span>
          <div className="po-input-wrap">
            <input className="po-input ac-input" type={show ? "text" : "password"} value={next} autoFocus
              onChange={(e) => setNext(e.target.value)} autoComplete="new-password" style={{ paddingLeft: 12, paddingRight: 44 }} />
            <button type="button" className="po-btn po-btn--ghost po-btn--icon po-btn--sm" style={{ position: "absolute", right: 6 }}
              onClick={() => setShow((v) => !v)} aria-label={show ? "Hide passwords" : "Show passwords"}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {next && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={`po-tone-${s.tone}`}
                    style={{ height: 4, borderRadius: 2, background: n <= s.score ? "var(--tone)" : "var(--po-surface-3)", transition: "background .2s" }} />
                ))}
              </div>
              <span className={`po-tone-${s.tone}`} style={{ fontSize: 12, fontWeight: 600, color: "var(--tone)", minWidth: 76, textAlign: "right" }}>{s.label}</span>
            </div>
          )}
        </label>

        <label className="po-field">
          <span className="po-label">Confirm new password</span>
          <input className="po-input ac-input" type={show ? "text" : "password"} value={confirm}
            onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          {mismatch && <span style={{ fontSize: 12, color: "var(--po-danger)" }}>Doesn’t match</span>}
        </label>

        <p className="po-hint" style={{ margin: 0 }}>
          At least 12 characters. A short phrase of unrelated words, like “mango river lantern 42”, is easy to remember and hard to guess.
        </p>

        <button type="submit" className="po-btn po-btn--primary ac-submit" disabled={!ready || saving}>
          {saving ? <><Loader2 size={17} className="po-spin" />Saving…</> : <>Set my password<ArrowRight size={17} /></>}
        </button>
      </form>
    </AuthCard>
  );
}
