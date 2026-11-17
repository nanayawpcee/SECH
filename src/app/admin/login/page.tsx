"use client";

import { useCallback, useRef, useState } from "react";
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
  Wallet,
  IdCard,
  Newspaper,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { homeAfterLogin, IDLE_SIGNOUT_KEY, useAuth } from "@/context/AuthContext";
import { IdleScreen } from "@/components/admin/IdleScreen";

const FEATURES = [
  { icon: CalendarCheck2, title: "Appointments", text: "Confirm bookings and plan the week ahead." },
  { icon: Wallet, title: "Accounts office", text: "Receipts, vouchers, advances and staff rent." },
  { icon: Newspaper, title: "News and notices", text: "Hospital news, staff notices and comments." },
  { icon: IdCard, title: "HR and staff records", text: "Employee records, departments and ranks." },
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
  // signed out for being away: show the idle screen first, which peels off to this form
  const [idle, setIdle] = useState(() => {
    if (typeof window === "undefined") return false;
    let flagged = false;
    try { flagged = sessionStorage.getItem(IDLE_SIGNOUT_KEY) === "1"; } catch {}
    return flagged || new URLSearchParams(window.location.search).get("idle") === "1";
  });
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const leaveIdle = useCallback(() => {
    setIdle(false);
    // the sheet is gone: put the cursor where the person will type next
    requestAnimationFrame(() => {
      const id = identifierRef.current;
      (id && id.value.trim() ? passwordRef.current : id)?.focus();
    });
    try { sessionStorage.removeItem(IDLE_SIGNOUT_KEY); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.delete("idle");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

  const fail = (message: string) => {
    setError(message);
    setShakeKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      {idle && <IdleScreen onDone={leaveIdle} />}
      <aside className="lg-brand">
        {/* the hospital, the same artwork as the idle screen */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lg-art" src="/images/portal-idle.jpg" alt="" />
        <div className="lg-art-shade" aria-hidden="true" />

        <div className="lg-brand-inner">
          <Link href="/" prefetch={false} className="lg-home">
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

      <main className="lg-main">
        <Link href="/" prefetch={false} className="lg-back"><ArrowLeft size={15} />Back to website</Link>

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
                  ref={identifierRef}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  // not while the idle screen is up, or the key that peels it would type here
                  autoFocus={!idle}
                  placeholder="admin@sech-gh.org"
                />
              </div>
            </label>

            <label className="po-field">
              <span className="po-label">Password</span>
              <div className="po-input-wrap">
                <Lock size={16} />
                <input
                  ref={passwordRef}
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

            <Link href="/admin/forgot-password" className="lg-forgot">Forgot your password?</Link>

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
        .lg-root { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 16px; padding: 16px;
          background:
            radial-gradient(800px 460px at 100% 0%, color-mix(in srgb, var(--po-gold) 18%, transparent), transparent 62%),
            radial-gradient(700px 500px at 60% 110%, color-mix(in srgb, #5B9BD5 14%, transparent), transparent 60%),
            var(--po-bg); }
        .lg-brand { position: relative; overflow: hidden; border-radius: 28px; color: #fff; min-height: calc(100vh - 32px);
          box-shadow: 0 30px 60px -30px rgba(6, 30, 23, .45); background: #c98b5e; }
        .lg-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 72%; transform: scale(1.02); }
        .lg-art-shade { position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(10, 26, 34, .66) 0%, rgba(10, 26, 34, .38) 26%, rgba(10, 26, 34, .04) 48%, rgba(10, 26, 34, .1) 66%, rgba(10, 26, 34, .78) 100%); }
        .lg-brand-inner { position: relative; height: 100%; min-height: calc(100vh - 32px); display: flex; flex-direction: column; gap: 14px; padding: 34px 40px 30px; }
        /* headline up in the sky, tiles along the bottom, the hospital left clear in between */
        .lg-brand-inner > div { display: contents; }
        .lg-brand-inner .lg-headline { margin-top: 26px; }
        .lg-features { margin-top: auto !important; }
        .lg-home { display: inline-flex; align-items: center; gap: 12px; color: #fff; text-decoration: none; }
        .lg-home img { width: 44px; height: 44px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(255,255,255,0.22); }
        .lg-home strong { display: block; font-size: 15px; }
        .lg-home small { display: block; font-size: 12px; color: rgba(255,255,255,0.75); }
        .lg-headline { font-family: var(--font-lora), Georgia, serif; font-size: clamp(34px, 4vw, 54px); line-height: 1.06; font-weight: 700; margin: 0 0 14px; letter-spacing: -0.01em;
          text-shadow: 0 4px 24px rgba(10, 26, 34, .35); }
        .lg-lede { font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.88); max-width: 430px; margin: 0; }
        .lg-features { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
        .lg-features li { display: grid; gap: 10px; align-content: start; padding: 16px 14px 18px; border-radius: 18px; min-height: 150px;
          background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.26);
          backdrop-filter: blur(12px) saturate(1.2); -webkit-backdrop-filter: blur(12px) saturate(1.2); }
        .lg-feature-icon { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; background: rgba(255,255,255,.92); color: #0A4F3C; }
        .lg-features strong { display: block; font-size: 14.5px; line-height: 1.3; margin-bottom: 4px; }
        .lg-features small { display: block; font-size: 12.5px; color: rgba(255,255,255,0.82); line-height: 1.45; }
        .lg-motto { margin: 0; font-family: var(--font-lora), Georgia, serif; font-style: italic; color: #F6D58A; font-size: 15px; }
        .lg-main { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; }
        .lg-back { position: absolute; top: 22px; right: 18px; display: inline-flex; gap: 6px; align-items: center; font-size: 13px; font-weight: 600; color: var(--po-text-3); text-decoration: none;
          padding: 8px 12px; border-radius: 999px; background: color-mix(in srgb, var(--po-surface) 70%, transparent); }
        .lg-back:hover { color: var(--po-brand-ink); }
        .lg-card { width: 100%; max-width: 420px !important; background: var(--po-surface); border: 1px solid color-mix(in srgb, var(--po-border) 55%, transparent); border-radius: 26px;
          padding: 36px 34px 28px; box-shadow: 0 1px 2px rgba(14, 29, 24, .04), 0 30px 60px -28px rgba(6, 30, 23, .35); }
        .lg-card-icon { width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; margin-bottom: 18px; color: #fff;
          background: linear-gradient(140deg, #0A4F3C, #1A7A5E); box-shadow: 0 10px 22px -10px rgba(10, 79, 60, .7); }
        .lg-title { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--po-text); }
        .lg-sub { margin: 6px 0 22px; color: var(--po-text-3); font-size: 14px; }
        .lg-input { height: 46px; font-size: 14.5px; border-radius: 12px !important; }
        .lg-submit { height: 48px; font-size: 14.5px; margin-top: 4px; border-radius: 14px !important; }
        .lg-forgot { justify-self: end; margin-top: -6px; font-size: 13px; font-weight: 600; color: var(--po-brand-ink); text-decoration: none; }
        .lg-forgot:hover { text-decoration: underline; }
        .lg-note { display: flex; gap: 10px; align-items: flex-start; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--po-border); font-size: 12.5px; color: var(--po-text-3); line-height: 1.5; }
        .lg-foot { margin: 28px 0 0; font-size: 12px; color: var(--po-text-3); }
        /* two by two when four across gets too narrow */
        @media (max-width: 1280px) { .lg-features { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lg-features li { min-height: 0; } }
        @media (max-width: 900px) {
          .lg-root { grid-template-columns: minmax(0, 1fr); padding: 12px; gap: 12px; }
          .lg-brand, .lg-brand-inner { min-height: 0; }
          .lg-brand-inner { padding: 22px 20px 26px; gap: 70px; }
          .lg-lede, .lg-features, .lg-motto { display: none; }
          .lg-headline { font-size: 30px; margin: 0; }
          .lg-main { padding: 12px 4px 32px; justify-content: flex-start; }
          .lg-back { position: static; align-self: flex-start; margin-bottom: 14px; }
          .lg-card { padding: 28px 22px 22px; }
        }
      `}</style>
    </div>
  );
}
