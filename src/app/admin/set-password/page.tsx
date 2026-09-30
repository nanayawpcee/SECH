"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowRight, Eye, EyeOff, KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { homeFor } from "@/lib/permissions";
import { passwordStrength } from "@/lib/password-strength";

/**
 * First sign-in with a temporary password. The person must choose their own
 * before the portal will do anything else — the server refuses every other
 * request until WordPress has cleared the flag.
 */
export default function SetPasswordPage() {
  const { admin, loading, logout, passwordChanged } = useAuth();
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const s = useMemo(() => passwordStrength(next), [next]);
  const mismatch = confirm.length > 0 && confirm !== next;
  const reused = next.length > 0 && next === current;
  const ready = current && next.length >= 12 && next === confirm && !reused;

  if (loading || !admin) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        logout(); // the session itself has ended
        return;
      }
      if (!res.ok) throw new Error(data.error || "Could not set your password.");
      passwordChanged();
      window.location.replace(homeFor(admin.perms));
    } catch (err: any) {
      setError(err?.message ?? "Could not set your password.");
      setSaving(false);
    }
  };

  const firstName = admin.name.split(" ")[0] || "there";

  return (
    <div className="ad-root sp-root">
      <motion.form
        className="sp-card"
        onSubmit={submit}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        noValidate
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="" className="sp-logo" />
        <h1 className="sp-title">Welcome, {firstName}</h1>
        <p className="sp-sub">
          You signed in with a temporary password. Choose your own now. It’s the only one you’ll use from here on,
          and nobody else will know it.
        </p>

        {error && (
          <div className="ad-alert ad-tone-danger" role="alert" style={{ marginBottom: 14 }}>
            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
          </div>
        )}

        {/* Lets password managers file the new password under the right account. */}
        <input type="text" name="username" autoComplete="username" value={admin.email || admin.name} readOnly hidden />

        <div style={{ display: "grid", gap: 14 }}>
          <label className="ad-field">
            <span className="ad-label">Temporary password</span>
            <div className="ad-input-wrap">
              <KeyRound size={16} />
              <input className="ad-input sp-input" type={show ? "text" : "password"} value={current}
                onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" autoFocus
                placeholder="The one you were given" style={{ paddingRight: 44 }} />
              <button type="button" className="ad-btn ad-btn--ghost ad-btn--icon ad-btn--sm" style={{ position: "absolute", right: 6 }}
                onClick={() => setShow((v) => !v)} aria-label={show ? "Hide passwords" : "Show passwords"}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="ad-field">
            <span className="ad-label">New password</span>
            <input className="ad-input sp-input" type={show ? "text" : "password"} value={next}
              onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            {next && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={`ad-tone-${s.tone}`}
                      style={{ height: 4, borderRadius: 2, background: n <= s.score ? "var(--tone)" : "var(--ad-surface-3)", transition: "background .2s" }} />
                  ))}
                </div>
                <span className={`ad-tone-${s.tone}`} style={{ fontSize: 12, fontWeight: 600, color: "var(--tone)", minWidth: 76, textAlign: "right" }}>{s.label}</span>
              </div>
            )}
            {reused && <span style={{ fontSize: 12, color: "var(--ad-danger)" }}>Choose something different from the temporary password</span>}
          </label>

          <label className="ad-field">
            <span className="ad-label">Confirm new password</span>
            <input className="ad-input sp-input" type={show ? "text" : "password"} value={confirm}
              onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            {mismatch && <span style={{ fontSize: 12, color: "var(--ad-danger)" }}>Doesn’t match</span>}
          </label>

          <p className="ad-hint" style={{ margin: 0 }}>
            At least 12 characters. A short phrase of unrelated words, like “mango river lantern 42”, is easy to remember and hard to guess.
          </p>

          <button type="submit" className="ad-btn ad-btn--primary sp-submit" disabled={!ready || saving}>
            {saving ? <><Loader2 size={17} className="ad-spin" />Saving…</> : <>Set my password<ArrowRight size={17} /></>}
          </button>
        </div>

        <div className="sp-foot">
          <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><ShieldCheck size={15} />Signed in as {admin.name}</span>
          <button type="button" className="ad-btn ad-btn--sm ad-btn--ghost" onClick={logout}><LogOut size={14} />Not you?</button>
        </div>
      </motion.form>

      <style>{`
        .sp-root { min-height: 100vh; display: grid; place-items: center; padding: 32px 16px;
          background: radial-gradient(circle at 80% 0%, rgba(232,184,75,0.12), transparent 45%), var(--ad-bg); }
        .sp-card { width: 100%; max-width: 440px !important; background: var(--ad-surface); border: 1px solid var(--ad-border);
          border-radius: 20px; padding: 34px 32px 22px; box-shadow: 0 24px 60px -24px rgba(6,30,23,0.25); }
        .sp-logo { width: 52px; height: 52px !important; border-radius: 50%; display: block; margin-bottom: 16px; }
        .sp-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: var(--ad-text); }
        .sp-sub { margin: 8px 0 22px; font-size: 14px; line-height: 1.6; color: var(--ad-text-3); }
        .sp-input { height: 44px; font-size: 14.5px; }
        .sp-submit { height: 46px; font-size: 14.5px; margin-top: 4px; }
        .sp-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;
          margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--ad-border); font-size: 12.5px; color: var(--ad-text-3); }
        @media (max-width: 480px) { .sp-card { padding: 26px 20px 18px; } }
      `}</style>
    </div>
  );
}
