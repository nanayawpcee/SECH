"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

/** The centred card used by the forgot-password and reset-password pages. */
export function AuthCard({ title, sub, children, foot }: {
  title: string;
  sub?: React.ReactNode;
  children: React.ReactNode;
  foot?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="po-root ac-root">
      <Link href="/admin/login" className="ac-back"><ArrowLeft size={15} />Back to sign in</Link>
      <motion.div
        className="ac-card"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.png" alt="St. Elizabeth Catholic Hospital" className="ac-logo" />
        <h1 className="ac-title">{title}</h1>
        {sub && <p className="ac-sub">{sub}</p>}
        {children}
        {foot && <div className="ac-foot">{foot}</div>}
      </motion.div>
      <p className="ac-copy">© {new Date().getFullYear()} St. Elizabeth Catholic Hospital, Hwidiem</p>

      <style>{`
        .ac-root { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 16px 32px; position: relative;
          background: radial-gradient(circle at 80% 0%, rgba(232,184,75,0.12), transparent 45%), var(--po-bg); }
        .ac-back { position: absolute; top: 24px; left: 24px; display: inline-flex; gap: 6px; align-items: center; font-size: 13px; font-weight: 600; color: var(--po-text-3); text-decoration: none; }
        .ac-back:hover { color: var(--po-brand-ink); }
        .ac-card { width: 100%; max-width: 440px !important; background: var(--po-surface); border: 1px solid var(--po-border);
          border-radius: 20px; padding: 34px 32px 26px; box-shadow: 0 24px 60px -24px rgba(6,30,23,0.25); }
        .ac-logo { width: 52px; height: 52px !important; border-radius: 50%; display: block; margin-bottom: 16px; }
        .ac-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: var(--po-text); }
        .ac-sub { margin: 8px 0 22px; font-size: 14px; line-height: 1.6; color: var(--po-text-3); }
        .ac-input { height: 44px; font-size: 14.5px; }
        .ac-submit { height: 46px; font-size: 14.5px; margin-top: 4px; width: 100%; justify-content: center; }
        .ac-foot { margin-top: 20px; padding-top: 14px; border-top: 1px solid var(--po-border); font-size: 12.5px; line-height: 1.55; color: var(--po-text-3); }
        .ac-copy { margin: 24px 0 0; font-size: 12px; color: var(--po-text-3); }
        @media (max-width: 480px) {
          .ac-card { padding: 26px 20px 20px; }
          .ac-back { left: 16px; top: 18px; }
        }
      `}</style>
    </div>
  );
}
