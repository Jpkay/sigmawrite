# Background jobs

SigmaWrite uses authenticated Vercel Cron handlers. Vercel sends `Authorization: Bearer $CRON_SECRET`; handlers fail closed when the secret is absent or mismatched.

- Monday 07:00 UTC — immutable, idempotent weekly parent reports and Resend delivery.
- Daily 18:00 UTC — deduplicated due-retrieval notifications.
- Sunday 02:30 UTC — psychometric item/edge analysis.
- Daily 03:00 UTC — retention and atomically claimed deletion requests.
- Sunday 04:00 UTC — French automation quality monitoring and sparse-review cases.

`job_runs` enforces one running instance per job name. Every run records completion or failure; Sentry receives failures and `OPS_ALERT_EMAIL` receives an operational email when Resend is configured. Report delivery uses a student/period/recipient business key, notifications use a daily dedupe key, and deletion workers claim rows with `FOR UPDATE SKIP LOCKED`.

Run `npm run launch:verify-env` before a hosted rehearsal. Cron success still requires exercising every endpoint in staging and confirming the corresponding `job_runs` row and external alert delivery.
