"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Forward this page — the phone's own share sheet where available. */
export function ShareButton({ focusTitle }: { focusTitle: string | null }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    const text = focusTitle ? `SECH staff notice: ${focusTitle}` : "SECH staff notice board";
    if (navigator.share) {
      try { await navigator.share({ title: text, text, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" className="ad-btn ad-btn--ghost" onClick={share}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}{copied ? "Link copied" : "Share this board"}
    </button>
  );
}
