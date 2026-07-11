# Operations runbooks

## LanguageTool down

Confirm `/v2/languages`, restart the private container, and inspect degraded
writing evaluations. Session completion remains available; do not resend pupil
text to a public grammar API.

## LLM outage or rate limiting

Pause generation, keep the mock only in non-production, inspect `/admin/ai-jobs`,
and retry failed jobs after provider recovery. Student scoring falls back to its
deterministic clamp; never bypass moderation for free text.

## Bad migration

Stop promotion, preserve a database backup, author a forward numbered repair,
test it on a fresh local database and staging, then rerun the deploy workflow.
Never rewrite an already-applied migration or reset production.

## Consent revocation

Confirm the active consent row has `revoked_at`, verify the student route gate,
and notify the guardian/school. Do not delete evidence unless a separate
deletion request exists.

## Deletion request

The request has a 30-day grace window. The daily retention job deletes the Auth
user, allowing foreign-key cascades to remove profile, student, learner profile,
attempts, reports and telemetry. Verify the request remains `completed` with a
null student link and that login fails.

## Content reviewer access or invitation failure

Confirm the person has a `content_reviewer` profile and an active row in
`content_reviewer_profiles`. Deactivation is authoritative in RLS and should
produce an empty/denied portal even with an existing Auth session. If SMTP is
unavailable, use the manual activation link returned only on
`/admin/reviews/reviewers`; transmit it privately and never paste service-role
credentials into a browser or message.

## Review disagreement or correction

Use `/admin/reviews/[versionId]` and record an administrative note. Never update
a submitted `passage_reviews` row: the database blocks it. Create a new content
review version for editorial changes and assign fresh reviews. If a benchmark
must be unlocked, use the dedicated action with a reason so the historical
version and frozen questions remain auditable.
