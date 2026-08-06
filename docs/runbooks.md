# Operations runbooks

## LanguageTool down

Confirm `/v2/languages`, restart the private container, and inspect degraded
writing evaluations. Session completion remains available; do not resend pupil
text to a public grammar API.

## LLM outage or rate limiting

Pause generation, keep the mock only in non-production, inspect `/admin/ai-jobs`,
and retry failed jobs after provider recovery. Deterministic scoring may remain available, but configured student free-text moderation fails closed; never bypass it.

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

## Interrupted reading completion

A caught completion error calls `fail_reading_completion`, records the claim as `failed`, and marks an otherwise incomplete session abandoned. Do not delete the claim or resubmit the same session: inspect its `error_message`, preserve partial evidence for audit, correct the underlying service/database issue, and have the learner start a new reading session. A claim left `processing` means the process died before its catch handler; confirm there is no active request, then mark it failed through the service-only RPC. Never manually increment mastery or retrieval attempts.

## Interrupted content publication

Publication keeps the text/version in draft until dependencies are ready. The action restores the candidate to `needs_human_review`, restores the approved review version, deletes the draft tree, and marks the claim `failed`; a retry can then acquire the failed claim. If the claim remains `processing`, automatic cleanup itself failed. Stop publication, inspect the candidate, review version and text/version foreign keys, restore them to the same pre-publication state in one reviewed transaction, then use the service-only failure RPC. Never delete an approved review submission or expose a draft text to students.
