"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MessageSquareText,
  Newspaper,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { homeAfterLogin, useAuth } from "@/context/AuthContext";

const FEATURES = [
  { icon: CalendarCheck2, title: "Appointments", text: "Confirm bookings and see the week ahead at a glance." },
  { icon: Newspaper, title: "News & updates", text: "Publish hospital news, events and health education." },
  { icon: MessageSquareText, title: "Community", text: "Moderate reader comments before they go live." },
];

export default function AdminLoginPage() {
  const { login, loading } = useAuth();
  const reduce = useReducedMotion();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const fail = (message: string) => {
    setError(message);
    setShakeKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Usernames are trimmed; passwords are not — a space can be part of one.
    if (!identifier.trim() || !password) {
      fail("Please enter your username or email and your password.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const loginError = await login(identifier.trim(), password);
      if (loginError) {
        setSubmitting(false);
        fail(loginError);
        return;
      }
      // A full navigation, so the portal starts from a clean session state —
      // the admin console or the staff area, by the person's permissions.
      window.location.replace(homeAfterLogin(new URLSearchParams(window.location.search).get("next")));
    } catch {
      setSubmitting(false);
      fail("We couldn’t reach the server. Check your connection and try again.");
    }
  };

  const onPasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);
  };

  if (loading) return null;

  return (
    <div className="po-root lg-root">
      {/* ── Brand panel ─────────────────────────────────────────────── */}
      <aside className="lg-brand">
        <svg className="lg-pattern" aria-hidden="true" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="lg-cross" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M19 14h6v5h5v6h-5v5h-6v-5h-5v-6h5z" fill="currentColor" />
            </pattern>
            <radialGradient id="lg-glow" cx="80%" cy="10%" r="70%">
              <stop offset="0%" stopColor="#E8B84B" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#E8B84B" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="400" fill="url(#lg-cross)" opacity="0.05" />
          <rect width="400" height="400" fill="url(#lg-glow)" />
        </svg>

        <div className="lg-brand-inner">
          <Link href="/" className="lg-home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" />
            <span>
              <strong>St. Elizabeth Catholic Hospital</strong>
              <small>Hwidiem · Ahafo Region</small>
            </span>
          </Link>

          <div>
            <motion.h1
              className="lg-headline"
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              The hospital’s<br />staff portal.
            </motion.h1>
            <p className="lg-lede">
              One place for the team to manage appointments, news and the conversations around them.
            </p>

            <ul className="lg-features">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.li
                    key={f.title}
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                  >
                    <span className="lg-feature-icon"><Icon size={18} /></span>
                    <span>
                      <strong>{f.title}</strong>
                      <small>{f.text}</small>
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </div>

          <p className="lg-motto">Health in body, mind and soul.</p>
        </div>
      </aside>

      {/* ── Sign-in ─────────────────────────────────────────────────── */}
      <main className="lg-main">
        <Link href="/" className="lg-back"><ArrowLeft size={15} />Back to website</Link>

        <motion.div
          key={shakeKey}
          className="lg-card"
          initial={reduce ? false : shakeKey ? { x: 0 } : { opacity: 0, y: 12 }}
          animate={shakeKey && !reduce ? { x: [0, -10, 10, -6, 6, 0] } : { opacity: 1, y: 0 }}
          transition={{ duration: shakeKey ? 0.4 : 0.45 }}
        >
          <div className="lg-card-icon"><Lock size={20} /></div>
          <h2 className="lg-title">Sign in</h2>
          <p className="lg-sub">Staff and administrators sign in here with their hospital account.</p>

          {error && (
            <div className="po-alert po-tone-danger" role="alert" style={{ marginBottom: 16 }}>
              <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 16 }}>
            <label className="po-field">
              <span className="po-label">Username or email</span>
              <div className="po-input-wrap">
                <UserRound size={16} />
                <input
                  className="po-input lg-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  placeholder="admin@sech-gh.org"
                />
              </div>
            </label>

            <label className="po-field">
              <span className="po-label">Password</span>
              <div className="po-input-wrap">
                <Lock size={16} />
                <input
                  className="po-input lg-input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onPasswordKey}
                  onKeyUp={onPasswordKey}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  className="po-btn po-btn--ghost po-btn--icon po-btn--sm"
                  style={{ position: "absolute", right: 6 }}
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {capsLock && (
                <span style={{ fontSize: 12, color: "var(--po-warn)", display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <AlertTriangle size={13} />Caps Lock is on
                </span>
              )}
            </label>

            <button type="submit" className="po-btn po-btn--primary lg-submit" disabled={submitting}>
              {submitting ? <><Loader2 size={17} className="po-spin" />Signing in…</> : <>Sign in<ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="lg-note">
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>Restricted to authorised hospital staff. Sessions end after a period of inactivity.</span>
          </div>
        </motion.div>

        <p className="lg-foot">© {new Date().getFullYear()} St. Elizabeth Catholic Hospital, Hwidiem</p>
      </main>

      <style>{`
        .lg-root { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); background: var(--po-bg); }
        .lg-brand { position: relative; overflow: hidden; background: linear-gradient(155deg, #0A4F3C 0%, #073A2D 45%, #041A14 100%); color: #fff; }
        .lg-pattern { position: absolute; inset: 0; width: 100%; height: 100%; color: #fff; }
        .lg-brand-inner { position: relative; height: 100%; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; gap: 40px; padding: 40px 56px; }
        .lg-home { display: inline-flex; align-items: center; gap: 12px; color: #fff; text-decoration: none; }
        .lg-home img { width: 44px; height: 44px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(255,255,255,0.1); }
        .lg-home strong { display: block; font-size: 15px; }
        .lg-home small { display: block; font-size: 12px; color: rgba(255,255,255,0.6); }
        .lg-headline { font-family: var(--font-lora), Georgia, serif; font-size: clamp(34px, 4vw, 52px); line-height: 1.08; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.01em; }
        .lg-lede { font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.72); max-width: 440px; margin: 0 0 36px; }
        .lg-features { list-style: none; padding: 0; margin: 0; display: grid; gap: 18px; max-width: 440px; }
        .lg-features li { display: flex; gap: 14px; align-items: flex-start; }
        .lg-feature-icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; background: rgba(232,184,75,0.14); color: #E8B84B; box-shadow: inset 0 0 0 1px rgba(232,184,75,0.2); }
        .lg-features strong { display: block; font-size: 14.5px; }
        .lg-features small { display: block; font-size: 13px; color: rgba(255,255,255,0.62); line-height: 1.5; }
        .lg-motto { margin: 0; font-family: var(--font-lora), Georgia, serif; font-style: italic; color: rgba(232,184,75,0.85); font-size: 15px; }
        .lg-main { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; }
        .lg-back { position: absolute; top: 28px; right: 28px; display: inline-flex; gap: 6px; align-items: center; font-size: 13px; font-weight: 600; color: var(--po-text-3); text-decoration: none; }
        .lg-back:hover { color: var(--po-brand-ink); }
        .lg-card { width: 100%; max-width: 420px !important; background: var(--po-surface); border: 1px solid var(--po-border); border-radius: 20px; padding: 36px 34px 28px; box-shadow: 0 24px 60px -24px rgba(6,30,23,0.25); }
        .lg-card-icon { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; background: var(--po-brand-soft); color: var(--po-brand-ink); margin-bottom: 18px; }
        .lg-title { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--po-text); }
        .lg-sub { margin: 6px 0 22px; color: var(--po-text-3); font-size: 14px; }
        .lg-input { height: 44px; font-size: 14.5px; }
        .lg-submit { height: 46px; font-size: 14.5px; margin-top: 4px; }
        .lg-note { display: flex; gap: 10px; align-items: flex-start; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--po-border); font-size: 12.5px; color: var(--po-text-3); line-height: 1.5; }
        .lg-foot { margin: 28px 0 0; font-size: 12px; color: var(--po-text-3); }
        @media (max-width: 900px) {
          .lg-root { grid-template-columns: minmax(0, 1fr); }
          .lg-brand-inner { min-height: 0; padding: 28px 24px 32px; gap: 24px; }
          .lg-lede, .lg-features, .lg-motto { display: none; }
          .lg-headline { font-size: 30px; margin: 0; }
          .lg-main { padding: 32px 16px 40px; justify-content: flex-start; }
          .lg-back { position: static; align-self: flex-start; margin-bottom: 18px; }
          .lg-card { padding: 28px 22px 22px; }
        }
      `}</style>
    </div>
  );
}
