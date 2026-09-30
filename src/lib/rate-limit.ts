import "server-only";

/**
 * Best-effort per-visitor limit for the public forms. In-memory, so each
 * server instance counts on its own — enough to stop one person hammering a
 * form; the WordPress plugin also caps the total per hour.
 */
export function createRateLimiter({ max, windowMs }: { max: number; windowMs: number }) {
  const hits = new Map<string, number[]>();
  return function limited(request: Request): boolean {
    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > max;
  };
}
