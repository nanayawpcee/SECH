"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, Pencil, Undo2 } from "lucide-react";
import { isMasked, type RevealCode, type SecretField } from "@/lib/reveal";

/** the same masking as the plugin, for a value that somehow arrives in full */
const maskLocal = (v: string) => (isMasked(v) ? v : `••••${v.length > 6 ? v.slice(-4) : ""}`);

/**
 * Hidden identifiers arrive masked ("••••6789"). Showing one asks for the
 * person's reveal PIN; a right PIN opens a 5-minute window on the server, so
 * further numbers show without asking again. Shown numbers hide again after
 * 30 seconds.
 */

const SHOW_SECONDS = 30;

export type RevealResult<T> = { ok: true; value: T } | { ok: false; code?: RevealCode | string; error: string };
export type RevealAttempt<T> = (pin: string) => Promise<RevealResult<T>>;

/** Posts to one of the reveal routes and reads the reply */
export async function revealRequest<T>(url: string, body: Record<string, unknown>, pick: (data: Record<string, unknown>) => T): Promise<RevealResult<T>> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, code: data.code, error: data.error || "That didn’t work. Please try again." };
    return { ok: true, value: pick(data) };
  } catch {
    return { ok: false, error: "Couldn’t reach the server. Check the connection and try again." };
  }
}

type Pending = { run: RevealAttempt<unknown>; resolve: (v: unknown) => void; title: string };

/**
 * Returns gate(run, title): runs the request, asking for the PIN first when
 * needed. Resolves to the value, or null if the person cancels.
 */
export function useRevealGate() {
  const [pending, setPending] = useState<Pending | null>(null);

  const gate = useCallback(<T,>(run: RevealAttempt<T>, title = "Show hidden number"): Promise<T | null> =>
    new Promise<T | null>((resolve) => {
      const ask = () => setPending({ run: run as RevealAttempt<unknown>, resolve: resolve as (v: unknown) => void, title });
      // try without the PIN first: within 5 minutes of a right PIN the server lets it through,
      // even after a page reload; otherwise it answers PIN_REQUIRED (not a wrong try)
      run("").then((r) => (r.ok ? resolve(r.value) : ask()));
    }), []);

  const dialog = pending ? (
    <RevealPinDialog
      title={pending.title}
      run={pending.run}
      onDone={(v) => { pending.resolve(v); setPending(null); }}
    />
  ) : null;

  return { gate, dialog };
}

type Mode = "loading" | "enter" | "set" | "locked";

function RevealPinDialog({ title, run, onDone }: { title: string; run: RevealAttempt<unknown>; onDone: (v: unknown) => void }) {
  const [mode, setMode] = useState<Mode>("loading");
  const [forgot, setForgot] = useState(false);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // inside the portal's root so its styles apply, but outside any sliding drawer
  // (this dialog only ever opens after a click, so document is there)
  const [host] = useState<Element>(() => document.querySelector(".po-root") ?? document.body);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        const res = await fetch("/api/staff/reveal-pin", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (gone) return;
        if (!res.ok) { setMode("enter"); setError(data.error || ""); return; }
        if (data.lockedFor > 0) {
          setMode("locked");
          setError(`Too many wrong tries. Try again in ${Math.ceil(data.lockedFor / 60)} minute${data.lockedFor > 60 ? "s" : ""}.`);
        } else setMode(data.hasPin ? "enter" : "set");
      } catch {
        if (!gone) setMode("enter");
      }
    })();
    return () => { gone = true; };
  }, []);

  const cancel = useCallback(() => { if (!busy) onDone(null); }, [busy, onDone]);

  useEffect(() => {
    // Escape closes only this dialog, not a drawer underneath it
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      cancel();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [cancel]);

  const finish = async (withPin: string) => {
    const r = await run(withPin);
    if (r.ok) {
      onDone(r.value);
      return;
    }
    if (r.code === "PIN_NOT_SET") { setMode("set"); setError(""); return; }
    if (r.code === "PIN_LOCKED") setMode("locked");
    setError(r.error);
    setPin("");
    pinRef.current?.focus();
  };

  const submit = async () => {
    setError("");
    if (mode === "enter") {
      if (!/^\d{4,6}$/.test(pin)) { setError("Enter your 4 to 6 digit PIN."); return; }
      setBusy(true);
      await finish(pin);
      setBusy(false);
      return;
    }
    if (mode === "set") {
      if (!password) { setError("Enter your account password."); return; }
      if (!/^\d{4,6}$/.test(pin)) { setError("Choose a PIN of 4 to 6 digits."); return; }
      if (pin !== pin2) { setError("The two PINs don’t match."); return; }
      setBusy(true);
      try {
        const res = await fetch("/api/staff/reveal-pin", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, pin }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.code === "PIN_LOCKED") setMode("locked");
          setError(data.error || "The PIN could not be saved.");
          setPassword("");
          return;
        }
        setPassword(""); setPin(""); setPin2("");
        await finish("");
      } finally {
        setBusy(false);
      }
    }
  };

  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);
  const heading = mode === "set" ? (forgot ? "Set a new reveal PIN" : "Set your reveal PIN") : title;

  const body = (
    <>
      <motion.div
        className="po-overlay rvp-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) cancel(); }}
      >
        <motion.form
          className="po-modal rvp-modal"
          role="dialog"
          aria-modal="true"
          aria-label={heading}
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          noValidate
        >
          <div className="po-kpi-icon po-tone-brand" style={{ marginBottom: 14 }}>
            {mode === "set" ? <KeyRound size={18} /> : <LockKeyhole size={18} />}
          </div>
          <h3 className="po-modal-title">{heading}</h3>

          {mode === "loading" && <div className="rvp-loading"><Loader2 size={18} className="po-spin" /></div>}

          {mode === "enter" && (
            <>
              <p className="po-modal-text">Enter your reveal PIN. Numbers you show are recorded in the staff audit log.</p>
              <input ref={pinRef} className="po-input rvp-pin" type="password" inputMode="numeric" autoComplete="off"
                aria-label="Reveal PIN" value={pin} onChange={(e) => setPin(digits(e.target.value))} autoFocus maxLength={6} placeholder="••••" />
              <button type="button" className="rvp-link" onClick={() => { setForgot(true); setMode("set"); setError(""); setPin(""); }}>
                Forgot your PIN?
              </button>
            </>
          )}

          {mode === "set" && (
            <>
              <p className="po-modal-text">
                {forgot
                  ? "Confirm it’s you with your account password, then choose a new PIN."
                  : "Hidden numbers like SSNIT, Ghana Card and bank accounts need a PIN to show. Choose 4 to 6 digits only you know, and confirm it’s you with your account password."}
              </p>
              <label className="po-field" style={{ marginBottom: 10 }}>
                <span className="po-label">Account password</span>
                <input className="po-input" type="password" autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} autoFocus />
              </label>
              <div className="rvp-two">
                <label className="po-field">
                  <span className="po-label">New PIN</span>
                  <input ref={pinRef} className="po-input rvp-pin" type="password" inputMode="numeric" autoComplete="new-password"
                    value={pin} onChange={(e) => setPin(digits(e.target.value))} maxLength={6} />
                </label>
                <label className="po-field">
                  <span className="po-label">PIN again</span>
                  <input className="po-input rvp-pin" type="password" inputMode="numeric" autoComplete="new-password"
                    value={pin2} onChange={(e) => setPin2(digits(e.target.value))} maxLength={6} />
                </label>
              </div>
              <p className="po-hint" style={{ margin: "8px 0 0" }}>Avoid repeated or running digits like 1111 or 1234. We’ll email you to confirm the change.</p>
            </>
          )}

          {mode === "locked" && <p className="po-modal-text">Showing hidden numbers is paused for your account. You can still use the rest of the portal.</p>}

          {error && (
            <div className="po-alert po-tone-danger" role="alert" style={{ marginTop: 12 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>{error}</span>
            </div>
          )}

          <div className="po-modal-actions">
            <button type="button" className="po-btn" onClick={cancel} disabled={busy}>{mode === "locked" ? "Close" : "Cancel"}</button>
            {(mode === "enter" || mode === "set") && (
              <button type="submit" className="po-btn po-btn--primary" disabled={busy}>
                {busy ? <><Loader2 size={15} className="po-spin" />Checking…</> : mode === "set" ? "Save PIN and show" : "Show"}
              </button>
            )}
          </div>
        </motion.form>
      </motion.div>
      <style>{`
        .rvp-overlay { z-index: 900; }
        .rvp-modal { width: min(400px, calc(100vw - 32px)); }
        .rvp-pin { font-family: ui-monospace, monospace; letter-spacing: .4em; font-size: 18px; text-align: center; }
        .rvp-two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .rvp-link { margin-top: 10px; background: none; border: 0; padding: 0; font: inherit; font-size: 13px; font-weight: 600;
          color: var(--po-brand-ink); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
        .rvp-loading { display: grid; place-items: center; padding: 18px 0; color: var(--po-text-3); }
      `}</style>
    </>
  );

  return createPortal(body, host);
}

/** "Show" for one masked identifier; hides itself again after 30 seconds */
export function RevealValue({ masked, field, employeeId, label }: {
  masked: string | null | undefined;
  field: SecretField;
  /** leave out for the signed-in person's own record */
  employeeId?: number;
  label: string;
}) {
  const { gate, dialog } = useRevealGate();
  const [shown, setShown] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (shown === null) return;
    const id = window.setInterval(() => setLeft((s) => {
      if (s <= 1) { setShown(null); return 0; }
      return s - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [shown]);

  if (!masked) return <>Not recorded</>;

  const show = async () => {
    setBusy(true);
    const value = await gate(
      (pin) => revealRequest("/api/staff/reveal", { field, employeeId, pin }, (d) => String(d.value ?? "")),
      `Show ${label}`,
    );
    setBusy(false);
    if (value !== null) { setShown(value); setLeft(SHOW_SECONDS); }
  };

  return (
    <span className="rv-value">
      <span className="rv-text" aria-live="polite">{shown ?? maskLocal(masked)}</span>
      {shown !== null ? (
        <button type="button" className="po-btn po-btn--sm po-btn--ghost" onClick={() => setShown(null)}>
          <EyeOff size={14} />Hide<span className="rv-left">{left}s</span>
        </button>
      ) : (
        <button type="button" className="po-btn po-btn--sm po-btn--ghost" onClick={show} disabled={busy} aria-label={`Show ${label}`}>
          {busy ? <Loader2 size={14} className="po-spin" /> : <Eye size={14} />}Show
        </button>
      )}
      {dialog}
      <style>{`
        .rv-value { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
        .rv-text { font-family: ui-monospace, monospace; overflow-wrap: anywhere; }
        .rv-left { font-size: 11px; color: var(--po-text-3); font-variant-numeric: tabular-nums; margin-left: 2px; }
      `}</style>
    </span>
  );
}

/**
 * An identifier in the staff editor. A saved number shows masked with Show and
 * Change; it is only sent on save once HR chooses Change and types a new one.
 */
export function SecretField({ label, stored, editing, onEditing, field, employeeId, children, hint }: {
  label: string;
  stored: string | null | undefined;
  editing: boolean;
  onEditing: (on: boolean) => void;
  field: SecretField;
  employeeId?: number;
  /** the input used while editing */
  children: ReactNode;
  hint?: ReactNode;
}) {
  const saved = !!stored;
  return (
    <div className="po-field">
      <span className="po-label">{label}</span>
      {saved && !editing ? (
        <div className="sf-box">
          <RevealValue masked={stored} field={field} employeeId={employeeId} label={label} />
          <button type="button" className="po-btn po-btn--sm po-btn--ghost" onClick={() => onEditing(true)}><Pencil size={13} />Change</button>
        </div>
      ) : (
        <>
          {children}
          {saved && (
            <button type="button" className="sf-keep" onClick={() => onEditing(false)}><Undo2 size={12} />Keep the saved number</button>
          )}
        </>
      )}
      {hint}
      <style>{`
        .sf-box { display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap; min-height: 40px;
          padding: 4px 6px 4px 12px; border-radius: 10px; border: 1px solid var(--po-border); background: var(--po-surface-2); }
        .sf-keep { align-self: flex-start; display: inline-flex; align-items: center; gap: 4px; background: none; border: 0; padding: 0;
          font: inherit; font-size: 12px; font-weight: 600; color: var(--po-text-2); cursor: pointer; }
        .sf-keep:hover { color: var(--po-text); }
      `}</style>
    </div>
  );
}
