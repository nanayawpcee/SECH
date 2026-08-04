"use client";

import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if ((!projectToken || !host) && process.env.NODE_ENV !== "production") {
  throw new Error(
    !projectToken
      ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
      : "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured",
  );
}

if (projectToken && host) {
  posthog.init(projectToken, {
    api_host: host,
    defaults: "2025-05-24",
    capture_pageview: true,
    capture_pageleave: true,
    capture_exceptions: true,
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return children;
}
