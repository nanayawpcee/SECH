"use client";

import Image from "next/image";
import { CloudOff, Home, LayoutDashboard, Phone, RefreshCw } from "lucide-react";
import { SITE, telHref } from "@/lib/data";

/**
 * The "page didn't load" screen, shared by the app's error page, the root-layout
 * fallback and the static 500 page, so all three look the same. Styles live in
 * not-found.css next to the 404 page they match.
 */
export function ErrorScreen({
  onRetry,
  retrying = false,
  portal,
  digest,
  fullHeight = false,
}: {
  onRetry: () => void;
  retrying?: boolean;
  /** inside the staff or admin portal: offer the dashboard, not the public home */
  portal?: "/admin" | "/staff";
  digest?: string;
  fullHeight?: boolean;
}) {
  return (
    <div className="nf" role="alert" style={fullHeight ? { minHeight: "100vh" } : undefined}>
      <div className="nf-inner">
        <div className="nf-art">
          <CloudOff className="err-icon" aria-hidden="true" strokeWidth={1.4} />
          <div className="nf-logo">
            <Image src="/images/logo.png" alt="St. Elizabeth Catholic Hospital logo" width={80} height={80} />
          </div>
        </div>

        <h1>This page didn&apos;t load</h1>
        <p className="nf-text">
          Something went wrong while we were loading this page. It&apos;s usually brief, so please try again in a moment.
        </p>

        <div className="nf-actions">
          <button type="button" className="btn-primary" onClick={onRetry} disabled={retrying}>
            <RefreshCw size={16} aria-hidden="true" className={retrying ? "err-spin" : undefined} />
            {retrying ? "Trying again" : "Try again"}
          </button>
          {/* plain links: the static 500 page sits outside the app's router */}
          {portal ? (
            <a href={portal} className="btn-outline">
              <LayoutDashboard size={16} aria-hidden="true" />
              Back to the dashboard
            </a>
          ) : (
            <a href="/" className="btn-outline">
              <Home size={16} aria-hidden="true" />
              Return to Home
            </a>
          )}
        </div>

        {!portal && (
          <div className="nf-help">
            <p>Need care urgently? Our emergency department is open 24 hours.</p>
            <a href={telHref(SITE.emergencyPhones[0])} className="err-call">
              <Phone size={15} aria-hidden="true" />
              Emergency {SITE.emergencyPhones[0]}
            </a>
          </div>
        )}

        {digest && <p className="err-ref">Reference {digest}</p>}
      </div>
    </div>
  );
}
