/**
 * Error monitoring (PRD §19). Scaffold: logs locally and forwards to Sentry
 * when SENTRY_DSN is set. Replace with `@sentry/nextjs` (instrumentation +
 * client/server configs) for tracing, replay, and source maps.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  // Always surface locally.
  console.error("[rtl]", error, context);

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return; // no-op until configured
  // A full Sentry envelope is non-trivial; the @sentry/nextjs SDK is the
  // intended integration. This hook marks the single forwarding point.
}
