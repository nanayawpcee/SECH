"use client";

import { useEffect } from "react";

/**
 * Marks the element named in the address bar's #hash with data-hash-target,
 * for styling. CSS :target alone misses it when the page was reached through
 * a client-side link, which is how the site's own links navigate.
 */
export function HashHighlight() {
  useEffect(() => {
    let marked: Element | null = null;
    const mark = () => {
      marked?.removeAttribute("data-hash-target");
      const id = decodeURIComponent(window.location.hash.slice(1));
      marked = id ? document.getElementById(id) : null;
      marked?.setAttribute("data-hash-target", "");
    };
    mark();
    window.addEventListener("hashchange", mark);
    return () => { window.removeEventListener("hashchange", mark); marked?.removeAttribute("data-hash-target"); };
  }, []);
  return null;
}
