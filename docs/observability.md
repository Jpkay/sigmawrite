# Analytics, feature rollout and error monitoring

PostHog is enabled only when `NEXT_PUBLIC_POSTHOG_KEY` (client) or
`POSTHOG_KEY` (server) is present. Client identities are random per-browser-session pseudonyms; server identities are HMAC pseudonyms keyed by `ANALYTICS_ID_SALT`. Raw profile/student UUIDs, names, free text, report/card/class identifiers, autocapture, and session recording are excluded by the analytics adapter. Instrumented
events cover onboarding, diagnostic start/finish, reading completion, parent
report opening, assignment creation and class export.

The three highest-risk surfaces have server-side environment gates:
`ADAPTIVE_DIAGNOSTIC_ENABLED`, `WRITING_EVALUATION_ENABLED`, and
`CATCH_UP_PLAN_ENABLED`. Setting one to `false` disables its entry point per
deployment. PostHog remains available for remote flags through the shared
client adapter.

Sentry is keyless/no-op unless `SENTRY_DSN` and/or `NEXT_PUBLIC_SENTRY_DSN` are
set. Build-time source-map upload additionally needs `SENTRY_ORG`,
`SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN`. Configure alerts in Sentry/PostHog
for: any `job_runs.status=failed`, AI generation failure rate above 10% over 15
minutes, and moderation rejection/error anomalies above the pilot baseline.
