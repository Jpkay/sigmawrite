# Background jobs

Sigmawrite uses Vercel Cron to call two authenticated Route Handlers. Vercel
sends `Authorization: Bearer $CRON_SECRET`; the handlers reject every request
when the secret is absent or mismatched.

- Monday 07:00 UTC: immutable weekly parent reports, followed by transactional
  email through Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured.
- Daily 18:00 UTC: due-retrieval notifications.

Every attempt first inserts a `job_runs` row, then marks it completed or failed
with a processed count/error. Email is deliberately a recorded no-op in keyless
development. Re-running a weekly job creates new report snapshots and never
rewrites the evidence payload of an old one.
