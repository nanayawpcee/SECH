"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

// Lucide has no brand marks, so these are drawn directly (currentColor).
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.41 9.41 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.99 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43zm8.03-17.47A11.28 11.28 0 0 0 12.05.7C5.8.7.7 5.8.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.3l5.7-1.5a11.33 11.33 0 0 0 5.74 1.47h.01c6.26 0 11.35-5.1 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z" />
  </svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z" />
  </svg>
);
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z" />
  </svg>
);

/** Share an article to the channels staff and patients actually use. */
export function ArticleShare({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);

  // The address is only known in the browser; read it after mount so the
  // server and first client render agree.
  useEffect(() => {
    setUrl(window.location.href.split("#")[0]);
    setCanNative(typeof navigator.share === "function");
  }, []);

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer,width=640,height=560");
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — nothing useful to show */
    }
  };

  return (
    <div className="nw-share">
      <span className="nw-share-label">Share this story</span>
      <div className="nw-share-row">
        <button type="button" className="nw-share-btn" data-net="whatsapp" disabled={!url}
          onClick={() => open(`https://wa.me/?text=${t}%20${u}`)} aria-label="Share on WhatsApp" title="WhatsApp">
          <WhatsAppIcon />
        </button>
        <button type="button" className="nw-share-btn" data-net="facebook" disabled={!url}
          onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${u}`)} aria-label="Share on Facebook" title="Facebook">
          <FacebookIcon />
        </button>
        <button type="button" className="nw-share-btn" data-net="x" disabled={!url}
          onClick={() => open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`)} aria-label="Share on X" title="X">
          <XIcon />
        </button>
        <button type="button" className="nw-share-btn" disabled={!url} onClick={copy}
          aria-label={copied ? "Link copied" : "Copy link"} title={copied ? "Copied" : "Copy link"}>
          {copied ? <Check size={17} /> : <Link2 size={17} />}
        </button>
        {canNative && (
          <button type="button" className="nw-share-btn" onClick={() => navigator.share({ title, url }).catch(() => {})}
            aria-label="More sharing options" title="More">
            <Share2 size={17} />
          </button>
        )}
      </div>
      <span className="nw-share-status" aria-live="polite">{copied ? "Link copied" : ""}</span>
    </div>
  );
}
