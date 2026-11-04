"use client";

import { useEffect } from "react";

// :target doesn't update on client-side navigation, so mark the element ourselves
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
